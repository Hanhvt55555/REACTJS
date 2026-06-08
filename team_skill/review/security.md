# Skill Review — Xác nhận quan điểm bảo mật

## Mục đích

Xác nhận mã nguồn (frontend / backend) và tài liệu thiết kế có trong PR từ quan điểm bảo mật, phát hiện lỗ hổng bảo mật, rủi ro và vi phạm best practice. Tham chiếu OWASP Top 10, chỉ ra các vấn đề theo quan điểm xác thực (authentication), phân quyền (authorization), kiểm tra đầu vào (input validation), quản lý thông tin nhạy cảm và phụ thuộc.

## Cú pháp gọi

```text
/review:security <PR_URL> [--files <file1> ...] [--scope <all|code|doc>]
```

- `PR_URL`: URL PR trên GitHub (ví dụ: `https://github.com/org/trion-frontend/pull/45`)
- `--files`: Đường dẫn file cần review (nếu bỏ qua sẽ tự động lấy từ các file thay đổi trong PR)
- `--scope`: Phạm vi review (`all` gồm cả code và tài liệu thiết kế, `code` chỉ mã nguồn, `doc` chỉ tài liệu thiết kế. Mặc định là `all`)

**Ví dụ:**

```bash
# Tự động hoàn toàn (phát hiện các file thay đổi trong PR và review tất cả)
/review:security https://github.com/rikkeiosaka/trion-frontend/pull/45

# Chỉ review mã nguồn
/review:security https://github.com/rikkeiosaka/trion-backend/pull/30 --scope code

# Chỉ định file cụ thể
/review:security https://github.com/rikkeiosaka/trion-frontend/pull/45 \
  --files trion-frontend/src/pages/Login.tsx trion-frontend/src/api/auth.ts
```

---

## Quy trình thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `PR_URL`: URL đầy đủ của PR
- `--files`: Đường dẫn local của các file cần review (tùy chọn, có thể chỉ định nhiều file)
- `--scope`: Một trong `all` / `code` / `doc` (mặc định là `all`)

Nếu thiếu `PR_URL`, hiển thị thông báo lỗi và cú pháp đúng rồi dừng xử lý.

### Bước 2 — Lấy thông tin PR và xác nhận comment cũ (thực thi song song)

**Thực thi đồng thời 2 lệnh sau (song song):**

```bash
# [A] Lấy thông tin PR
gh pr view <PR_URL> --json number,title,headRefName,headRepository,files

# [B] Lấy comment review cũ (chỉ trích xuất dòng ❌/⚠️ để tiết kiệm token)
gh api repos/<owner/repo>/issues/<PR番号>/comments \
  --jq '[.[] | select(.body | contains("review-security") or contains("Review Security") or contains("Review bảo mật"))
         | {id: .id, created_at: .created_at,
            issues: (.body | split("\n")
              | map(select(
                  startswith("- ❌") or startswith("- ⚠️") or
                  startswith("**[") or
                  (contains("❌") and contains("|")) or
                  (contains("⚠️") and contains("|"))
                ))
              | join("\n"))}]'
```

※ Số PR được trích xuất trực tiếp từ PR_URL (ví dụ: `.../pull/45` → `45`). Có thể thực thi [B] mà không cần chờ [A] hoàn thành.

Từ [A] trích xuất:
- `headRefName`: Tên branch của PR
- `headRepository.nameWithOwner`: `owner/repo`
- `files[].path` và `files[].changeType`: Danh sách file thay đổi trong PR và loại thay đổi

### Bước 2.5 — Xác nhận comment review cũ

Sử dụng kết quả [B] ở trên.

Nếu tồn tại comment review cũ (từ skill `/review:security`):

1. Trích xuất nội dung các chỉ trích ❌ lỗ hổng bảo mật / rủi ro và ⚠️ cần cải thiện từ comment review mới nhất
2. So sánh với nội dung file trên branch hiện tại để xác định từng chỉ trích đã được sửa hay chưa
3. Thêm section sau vào **đầu** phần preview ở Bước 7:

```markdown
### 📝 Xác nhận sửa chỉ trích lần trước

| Nội dung chỉ trích | Trạng thái |
|---|---|
| <Tóm tắt nội dung chỉ trích> | ✅ Đã sửa / ❌ Chưa sửa |
```

4. **Không review lại các file đã được review lần trước.** Từ Bước 3 đến Bước 6, chỉ xử lý các file mới được thêm hoặc thay đổi trong PR sau comment review trước. Bỏ qua các file đã được review trong comment cũ.

Nếu không có comment review cũ, bỏ qua bước này và review tất cả file như bình thường.

### Bước 3 — Xác định file cần review

Nếu `--files` được chỉ định, sử dụng danh sách đó.

Nếu bỏ qua, tự động trích xuất từ các file thay đổi trong PR theo `--scope`:

- `code`: Các file trong số `.ts` `.tsx` `.js` `.jsx` `.py` `.go` `.java` `.rb` `.php` có trong PR
- `doc`: Các file `.md` nằm trong thư mục `docs/`
- `all`: Cả hai loại trên

```bash
gh pr view <PR_URL> --json files --jq '.files[].path'
```

**Loại trừ tại đây các file đã được xác định là đã review ở Bước 2.5.**

Nếu số file cần xử lý là 0, hiển thị "Không tìm thấy file cần review" rồi dừng xử lý.

### Bước 4 — Lấy file từ branch PR

Với mỗi file cần review, chuyển đổi cách lấy theo loại thay đổi (`changeType`) trong PR:

**Trường hợp ADDED (thêm mới) — Lấy toàn bộ nội dung:**
```bash
gh api "repos/<owner/repo>/contents/<file_path>?ref=<branch>" --jq '.content' | base64 -d
```

**Trường hợp MODIFIED (chỉnh sửa hiện có) — Chỉ lấy diff (tiết kiệm token):**
```bash
gh api repos/<owner/repo>/pulls/<PR番号>/files \
  --jq '.[] | select(.filename=="<file_path>") | .patch'
```

Nếu chỉ có diff, giới hạn review ở phần thay đổi. Phần chưa thay đổi được coi là đã review lần trước.

Nếu file không tồn tại trên branch, ghi nhận "Không tìm thấy trong PR" và tiếp tục xử lý các file khác.

### Bước 5 — Xác nhận file phụ thuộc (tùy chọn)

Nếu trong các file thay đổi của PR có `package.json` / `package-lock.json` / `requirements.txt` / `go.mod` / `Gemfile` / `composer.json`, lấy nội dung thêm / cập nhật phụ thuộc:

```bash
gh api repos/<owner/repo>/pulls/<PR番号>/files \
  --jq '.[] | select(.filename=="<dependency_file>") | .patch'
```

Đưa vào phạm vi review việc kiểm tra xem các package được thêm / cập nhật có lỗ hổng bảo mật đã biết (CVE) không.

### Bước 6 — So sánh và phân tích theo quan điểm bảo mật

Với mỗi file đã lấy, phát hiện vấn đề bảo mật theo các quan điểm sau.

**Quan điểm chung (áp dụng cho cả code và tài liệu thiết kế):**

1. **Xác thực / Phân quyền (Authentication / Authorization)**
   - Các endpoint / màn hình không nên công khai có được thiết lập xác thực không
   - Kiểm tra quyền (role / scope) có được implement đúng không
   - Quản lý session (thời hạn token / làm mới / thu hồi) có phù hợp không
   - Việc xác thực Bearer token / JWT có được implement không

2. **Kiểm tra đầu vào (Input Validation)**
   - Có implement validation (kiểu / độ dài / định dạng) cho đầu vào của người dùng không
   - Có kiểm tra phía server không (không phụ thuộc hoàn toàn vào phía client)
   - Có biện pháp chống SQL injection (sử dụng placeholder / ORM) không
   - Có biện pháp chống command injection (escape tham số shell) không
   - Có biện pháp chống path injection (ngăn path traversal) không

3. **Output Encoding / XSS**
   - Có sử dụng `dangerouslyInnerHTML` trong JSX không. Nếu có, có được sanitize không
   - Các ký tự đặc biệt HTML trong response từ backend có được escape không
   - Có sử dụng `eval` / `Function` / `setTimeout(string)` không

4. **Xử lý thông tin nhạy cảm (Sensitive Data Exposure)**
   - Mật khẩu / API key / token / secret có bị hardcode không
   - File `.env` / file cấu hình có chứa thông tin nhạy cảm không
   - Thông tin nhạy cảm có bị xuất ra log không (mật khẩu / token / thông tin cá nhân)
   - Thông tin nhạy cảm có được lưu vào sessionStorage / localStorage không
   - Giao tiếp HTTPS có được bắt buộc không (có cho phép HTTP không)

5. **CSRF / SSRF / Open Redirect**
   - Các request thay đổi trạng thái có implement CSRF token không
   - Các request đến URL bên ngoài (lấy ảnh / Webhook, v.v.) có kiểm tra URL không
   - URL đích của redirect có được kiểm tra (whitelist) không

6. **Mã hóa (Cryptography)**
   - Mật khẩu có được lưu dưới dạng hash (sử dụng bcrypt / argon2 / scrypt) không
   - Có sử dụng thuật toán hash yếu (MD5 / SHA-1) không
   - Việc tạo giá trị ngẫu nhiên có sử dụng hàm an toàn về mặt mật mã (`crypto.randomBytes` / `secrets`) không

7. **Xử lý lỗi (Error Handling)**
   - Stack trace / đường dẫn nội bộ / lỗi SQL có được bao gồm trong response không
   - Từ thông báo lỗi có thể suy đoán được implementation nội bộ không

8. **Log và giám sát (Logging & Monitoring)**
   - Lỗi xác thực / lỗi phân quyền / thao tác nhạy cảm có được ghi log không
   - Log có chứa thông tin nhạy cảm không

9. **Phụ thuộc (Dependencies)**
   - Các package phụ thuộc được thêm vào có lỗ hổng bảo mật đã biết không
   - Có thêm package không còn được bảo trì không

**Quan điểm riêng cho tài liệu thiết kế:**

10. **Mô tả yêu cầu bảo mật**
    - Yêu cầu xác thực / phân quyền có được ghi rõ không
    - Chính sách xử lý các trường dữ liệu nhạy cảm (mật khẩu / thông tin cá nhân) có được ghi không
    - Chính sách thông báo lỗi (không tiết lộ thông tin nội bộ) có được ghi không

**Không thuộc phạm vi xác nhận:**

- Coding style / quy tắc đặt tên
- Tối ưu hiệu năng
- Tính hợp lý của business logic (tính nhất quán với đặc tả chức năng)
- Test coverage

### Bước 7 — Preview và xác nhận nội dung review

Sau khi hoàn thành phân tích tất cả file, hiển thị **một preview tiếng Nhật tổng hợp tất cả file** cho người dùng.

````markdown
## 🔒 セキュリティレビュー

**PR:** `<PR_URL>`
**対象ファイル数:** N件
**レビュー範囲:** `<scope>`

---

### `<file1>`

#### ❌ 脆弱性・リスク（High / Critical）
| 観点 | 該当箇所 | 問題の内容 | 推奨対応 |
|------|---------|-----------|---------|
| 入力検証 | `src/api/user.ts:42` | ユーザー入力を直接SQLクエリに埋め込んでいる | プレースホルダを使用する |

#### ⚠️ 要改善（Medium / Low）
| 観点 | 該当箇所 | 問題の内容 | 推奨対応 |
|------|---------|-----------|---------|
| ログ | `src/auth/login.ts:18` | 認証失敗時のログ記録がない | 認証失敗イベントをログに記録する |

#### 📝 参考情報
- <補足情報・ベストプラクティスの提案>

---

### `<file2>`
（同様のセクション構造）

---

### 📊 サマリー
| ファイル | ❌ 脆弱性 | ⚠️ 要改善 |
|---------|----------|----------|
| `<file1>` | N件 | N件 |
| `<file2>` | N件 | N件 |
````

Nếu cả ❌ và ⚠️ đều là 0 cho mỗi file, hiển thị "✅ Không phát hiện vấn đề bảo mật".

Sau khi hiển thị preview tiếng Nhật, **bắt buộc phải hiển thị thông báo xác nhận sau bằng tiếng Nhật và chờ sự chấp thuận của người dùng**:

> 上記の内容を PR にコメントとして投稿してよいですか？

Nếu người dùng chấp thuận, đăng theo định dạng sau đã được dịch sang **tiếng Việt** để đăng:

````markdown
## 🔒 Review bảo mật (Security Review)

**PR:** `<PR_URL>`
**Số file:** N件
**Phạm vi:** `<scope>`

---

### `<file1>`

#### ❌ Lỗ hổng / Rủi ro (High / Critical)
| Quan điểm | Vị trí | Nội dung vấn đề | Đề xuất xử lý |
|-----------|--------|-----------------|---------------|

#### ⚠️ Cần cải thiện (Medium / Low)
| Quan điểm | Vị trí | Nội dung vấn đề | Đề xuất xử lý |
|-----------|--------|-----------------|---------------|

#### 📝 Thông tin tham khảo
- <補足情報をベトナム語で>

---

### 📊 Tổng kết
| File | ❌ Lỗ hổng | ⚠️ Cần cải thiện |
|------|-----------|------------------|
| `<file1>` | N | N |

---

> 🤖 Review bảo mật tự động bởi `/review:security` skill
````

```bash
gh pr comment <PR_URL> --body "<ベトナム語コメント内容>"
```

Nếu người dùng từ chối hoặc yêu cầu chỉnh sửa, sửa **preview tiếng Nhật** theo hướng dẫn rồi xác nhận lại.

---

## Tiêu chí xác định mức độ nghiêm trọng

Phân loại các chỉ trích thành ❌ và ⚠️ theo tiêu chí sau:

**❌ Lỗ hổng bảo mật / Rủi ro (High / Critical) — Bắt buộc phải sửa:**
- SQL injection / command injection / path traversal
- XSS (sử dụng `dangerouslyInnerHTML` chưa được sanitize / sử dụng `eval`)
- Thông tin nhạy cảm bị hardcode (API key / mật khẩu / token)
- Thiếu xác thực / phân quyền (endpoint / màn hình cần xác thực nhưng chưa thiết lập)
- Lưu mật khẩu dạng plaintext / sử dụng thuật toán hash yếu
- Thêm package phụ thuộc có lỗ hổng bảo mật đã biết (CVE)

**⚠️ Cần cải thiện (Medium / Low) — Nên cải thiện:**
- Thiếu biện pháp chống CSRF (trường hợp ảnh hưởng giới hạn)
- Rò rỉ thông tin qua thông báo lỗi
- Thiếu log (bỏ sót ghi nhận lỗi xác thực / lỗi phân quyền)
- Chưa thiết lập security header (CSP / X-Frame-Options)
- Chưa thiết lập thời hạn session
- Chưa bắt buộc HTTPS

---

## Lưu ý

- Đối tượng xử lý là các file trong PR thay đổi phù hợp với `--scope`
- File cần review được lấy từ **branch của PR** (có thể khác với local)
- Khi review nhiều file, tổng hợp vào **một comment duy nhất**, phân chia theo section cho mỗi file
- Ghi rõ vị trí bằng định dạng `<file_path>:<line_number>` cho phần liên quan
- Không sử dụng biểu đạt mơ hồ ("v.v.", "các loại khác", "những thứ khác"). Nếu không thể liệt kê hết, xác nhận với người dùng
- Chỉ trích phải **dựa trên nội dung code thực tế, không phải phỏng đoán**. Nếu không rõ có lỗ hổng bảo mật hay không, phân loại vào ⚠️ và ghi rõ đề xuất xử lý
- Comment được viết bằng **tiếng Việt**
