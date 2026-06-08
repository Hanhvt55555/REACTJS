# Skill Review — Kiểm tra tính nhất quán giữa Tài liệu thiết kế API và Thiết kế chi tiết

## Mục đích

Đối chiếu tài liệu đặc tả OpenAPI (`openapi.json`) với tài liệu thiết kế chi tiết (Markdown) để xác nhận không có mâu thuẫn hay sai lệch về API endpoint, định nghĩa request/response, yêu cầu xác thực và xử lý lỗi.

## Cú pháp gọi

```text
/review:api <PR_URL> [--design <design_file> | --all] [--api <openapi_file>]
```

- `PR_URL`: URL của PR trên GitHub (ví dụ: `https://github.com/org/trion-docs/pull/12`)
- `--design`: Đường dẫn file tài liệu thiết kế chi tiết cần review (một file duy nhất)
- `--all`: Nhắm đến tất cả các file `DETAILED_DESIGN_*.md` trong `trion-doc/docs/screens/`
- Nếu bỏ qua `--api`, mặc định sử dụng `trion-doc/docs/public/openapi.json`.
- `--design` và `--all` bắt buộc chọn một trong hai.

**Ví dụ:**

```bash
# File đơn lẻ
/review:api https://github.com/rikkeiosaka/trion-docs/pull/15 \
  --design trion-doc/docs/screens/DETAILED_DESIGN_NO_1_2_LOGIN.md

# Review toàn bộ tài liệu thiết kế cùng lúc
/review:api https://github.com/rikkeiosaka/trion-docs/pull/15 --all

/review:api https://github.com/rikkeiosaka/trion-docs/pull/15 \
  --all \
  --api trion-doc/docs/public/openapi.json
```

---

## Các bước thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `PR_URL`: URL đầy đủ của PR
- `--design`: Đường dẫn cục bộ của tài liệu thiết kế chi tiết (trong thư mục `trion-doc/docs/screens/`). Loại trừ lẫn nhau với `--all`.
- `--all`: Nếu được chỉ định, nhắm đến tất cả file khớp với `trion-doc/docs/screens/DETAILED_DESIGN_*.md`
- `--api`: Đường dẫn cục bộ của tài liệu đặc tả OpenAPI (mặc định là `trion-doc/docs/public/openapi.json` nếu bỏ qua)

Nếu thiếu `PR_URL`, hoặc không chỉ định cả `--design` lẫn `--all`, hiển thị thông báo lỗi và cú pháp đúng rồi dừng xử lý.

Nếu `--all` được chỉ định, dùng công cụ Glob để liệt kê các file khớp với `trion-doc/docs/screens/DETAILED_DESIGN_*.md` và xác định danh sách file mục tiêu.

### Bước 2 — Lấy thông tin PR và kiểm tra comment cũ (thực hiện song song)

**Thực hiện đồng thời 2 lệnh sau (song song):**

```bash
# [A] Lấy thông tin PR
gh pr view <PR_URL> --json number,title,headRefName,headRepository,files

# [B] Lấy comment review cũ (chỉ trích xuất dòng ❌/⚠️ để tiết kiệm token)
gh api repos/<owner/repo>/issues/<PR番号>/comments \
  --jq '[.[] | select(.body | contains("review-api") or contains("Review API"))
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

※ Số PR được trích xuất trực tiếp từ PR_URL (ví dụ: `.../pull/15` → `15`). Có thể thực hiện [B] mà không cần chờ [A] hoàn thành.

Trích xuất từ [A]:
- `headRefName`: Tên branch của PR
- `headRepository.nameWithOwner`: `owner/repo` của repository
- `files[].path` và `files[].changeType`: Danh sách file thay đổi trong PR và loại thay đổi

### Bước 2.5 — Kiểm tra comment review cũ

Sử dụng kết quả từ [B] ở trên.

Nếu tồn tại comment review cũ (do skill `/review:api` tạo ra):

1. Trích xuất nội dung ❌ mâu thuẫn/sai lệch và ⚠️ chưa định nghĩa từ comment review mới nhất
2. Đối chiếu với nội dung file hiện tại trên branch và xác định từng mục đã được sửa hay chưa
3. Thêm section sau vào **đầu** phần preview ở Bước 6:

```markdown
### 📝 Xác nhận sửa chữa từ lần review trước

| Nội dung chỉ ra | Trạng thái |
|---|---|
| <Tóm tắt nội dung chỉ ra> | ✅ Đã sửa / ❌ Chưa sửa |
```

4. **Không review lại các file đã được review trước đó.** Từ Bước 3~5 trở đi, chỉ nhắm đến các file được thêm mới hoặc thay đổi vào PR sau comment review lần trước. Bỏ qua các file đã được review trong comment cũ.

Nếu không tồn tại comment review cũ, bỏ qua bước này và review toàn bộ file như bình thường.

### Bước 3 — Đọc file

- Tài liệu đặc tả OpenAPI (`--api`) được đọc từ cục bộ bằng công cụ Read
- Tài liệu thiết kế chi tiết được lấy từ **branch của PR** (1 file nếu dùng `--design`, lần lượt từng file nếu dùng `--all`):

Tài liệu thiết kế chi tiết được lấy từ **branch của PR** (chuyển đổi theo loại thay đổi trong PR):

**Trường hợp ADDED (thêm mới) — Lấy toàn bộ nội dung:**
```bash
gh api "repos/<owner/repo>/contents/<file_path>?ref=<branch>" --jq '.content' | base64 -d
```

**Trường hợp MODIFIED (sửa đổi) — Chỉ lấy diff (tiết kiệm token):**
```bash
gh api repos/<owner/repo>/pulls/<PR番号>/files \
  --jq '.[] | select(.filename=="<file_path>") | .patch'
```

Nếu chỉ có diff, giới hạn review chỉ ở phần thay đổi.

Nếu không tìm thấy tài liệu đặc tả OpenAPI, dừng xử lý. Nếu không tìm thấy tài liệu thiết kế chi tiết trên branch PR, ghi lại "Không tìm thấy trong PR" và tiếp tục xử lý các file khác.

### Bước 3 — Trích xuất các vị trí sử dụng API từ tài liệu thiết kế chi tiết

Trích xuất các thông tin sau từ tài liệu thiết kế chi tiết:

- API endpoint được ghi (đường dẫn, HTTP method)
- Tên field, kiểu dữ liệu, bắt buộc/tùy chọn cần đưa vào request
- Tên field, kiểu dữ liệu kỳ vọng trong response
- Yêu cầu xác thực (cần xác thực / không cần / Bearer token, v.v.)
- HTTP status code, error code được tham chiếu
- Tên key được lưu/tham chiếu trong sessionStorage

### Bước 4 — Trích xuất định nghĩa endpoint từ tài liệu đặc tả OpenAPI

Trích xuất các thông tin sau từ tài liệu đặc tả OpenAPI (JSON) (phân tích trực tiếp nội dung đã đọc bằng Read):

- `operationId`, đường dẫn, method, summary của tất cả endpoint
- Schema requestBody của từng endpoint (tên field, kiểu dữ liệu, required)
- Schema responses của từng endpoint (status code, tên field, kiểu dữ liệu)
- Định nghĩa security (có/không cần xác thực)

### Bước 5 — So sánh và phân tích (lặp lại theo từng file)

Đối với từng file tài liệu thiết kế chi tiết, đối chiếu theo các quan điểm sau và phát hiện mâu thuẫn/sai lệch.

**Các quan điểm kiểm tra:**

1. **Sự tồn tại của endpoint**: API endpoint mà tài liệu thiết kế chi tiết tham chiếu có được định nghĩa trong tài liệu đặc tả OpenAPI không
2. **HTTP method**: HTTP method ghi trong tài liệu thiết kế chi tiết có khớp với định nghĩa trong tài liệu đặc tả OpenAPI không
3. **Request field**: Tên field, kiểu dữ liệu, bắt buộc/tùy chọn mà tài liệu thiết kế chi tiết gửi đi có khớp với tài liệu đặc tả OpenAPI không
4. **Response field**: Tên field, kiểu dữ liệu trong response mà tài liệu thiết kế chi tiết tham chiếu có khớp với tài liệu đặc tả OpenAPI không
5. **Yêu cầu xác thực**: Mô tả có/không cần xác thực trong tài liệu thiết kế chi tiết có khớp với định nghĩa `security` trong tài liệu đặc tả OpenAPI không
6. **HTTP status và lỗi**: Error code, status ghi trong tài liệu thiết kế chi tiết có được định nghĩa trong `responses` của tài liệu đặc tả OpenAPI không
7. **Tương ứng giữa key sessionStorage và response**: Key mà tài liệu thiết kế chi tiết lưu vào sessionStorage có nhất quán với giá trị lấy từ response field của tài liệu đặc tả OpenAPI không

**Không thuộc phạm vi kiểm tra:**

- Chi tiết triển khai API (logic phía server)
- Sự khác biệt về từ ngữ trong comment/description của tài liệu đặc tả OpenAPI
- Nội dung giá trị mẫu (example)

### Bước 6 — Xem trước và xác nhận nội dung review

Sau khi hoàn thành phân tích tất cả file, hiển thị **một bản preview tiếng Nhật tổng hợp tất cả file** cho người dùng.

Trường hợp `--all`, hiển thị theo từng section riêng biệt cho từng file:

````markdown
## 📋 Review tính nhất quán API (Toàn bộ tài liệu thiết kế)

**OpenAPI:** `<đường dẫn file api>`
**Số tài liệu mục tiêu:** N件

---

### DETAILED_DESIGN_NO_1_2_LOGIN.md

#### 📋 Danh sách API được tham chiếu
| Method | Endpoint | OpenAPI | Ghi chú |
|--------|----------|---------|---------|
| POST | /v1/auth/login | ✅ Có | operationId: auth-login |

#### ❌ Các mục phát hiện mâu thuẫn / sai lệch
| Quan điểm | Nội dung trong tài liệu thiết kế | Định nghĩa trong OpenAPI | Ghi chú |
|-----------|----------------------------------|--------------------------|---------|

#### ⚠️ Có trong thiết kế nhưng chưa định nghĩa trong OpenAPI
- <Phần tử chưa định nghĩa>

#### 📝 Có trong OpenAPI nhưng không có trong tài liệu thiết kế
- <Phần tử chưa ghi trong thiết kế>

---

### DETAILED_DESIGN_NO_3_4_MYPAGE.md
（Cấu trúc section tương tự）

---

### 📊 Tổng kết
| Tài liệu | Số mâu thuẫn | Số chưa định nghĩa |
|---------|-------------|---------------------|
| DETAILED_DESIGN_NO_1_2_LOGIN.md | N件 | N件 |
| ... | ... | ... |
````

Trường hợp file đơn lẻ (`--design`), bỏ qua header tên file và hiển thị theo cấu trúc phẳng như thông thường.

Nếu số lượng mâu thuẫn là 0 cho từng file, hiển thị "✅ Không phát hiện mâu thuẫn/sai lệch".

Sau khi hiển thị preview tiếng Nhật, **bắt buộc phải đưa ra thông báo xác nhận sau bằng tiếng Nhật và chờ người dùng chấp thuận**:

> 上記の内容を PR にコメントとして投稿してよいですか？

Nếu người dùng chấp thuận, dịch sang **một comment tiếng Việt tổng hợp toàn bộ file** và đăng lên:

````markdown
## 📋 Review API — Tất cả tài liệu thiết kế

**OpenAPI:** `<đường dẫn file api>`
**Số tài liệu:** N件

---

### DETAILED_DESIGN_NO_1_2_LOGIN.md

#### 📋 Danh sách API được tham chiếu
| Method | Endpoint | OpenAPI | Ghi chú |
|--------|----------|---------|---------|

#### ❌ Mâu thuẫn / Sai lệch
| Quan điểm | Tài liệu thiết kế | OpenAPI | Ghi chú |
|-----------|-------------------|---------|---------|

#### ⚠️ Có trong thiết kế nhưng chưa định nghĩa trong OpenAPI
- <Phần tử chưa định nghĩa bằng tiếng Việt>

#### 📝 Có trong OpenAPI nhưng không có trong tài liệu thiết kế
- <Phần tử chưa ghi bằng tiếng Việt>

---

### DETAILED_DESIGN_NO_3_4_MYPAGE.md
（Cấu trúc section tương tự）

---

### 📊 Tổng kết
| Tài liệu | Số mâu thuẫn | Số thiếu định nghĩa |
|---------|-------------|---------------------|
| DETAILED_DESIGN_NO_1_2_LOGIN.md | N | N |
| ... | ... | ... |

---

> 🤖 Kiểm tra tính nhất quán API bởi `/review:api` skill
````

Trường hợp file đơn lẻ (`--design`), đăng theo định dạng section đơn như thông thường.

```bash
gh pr comment <PR_URL> --body "<Nội dung comment tiếng Việt>"
```

Nếu người dùng từ chối hoặc yêu cầu sửa đổi, sửa **preview tiếng Nhật** theo hướng dẫn rồi xác nhận lại.

---

## Lưu ý

- Tài liệu đặc tả OpenAPI (`--api`) được đọc từ cục bộ
- Tài liệu thiết kế chi tiết được lấy từ **branch của PR** (có thể khác với bản cục bộ)
- Khi chỉ định `--all`, dùng Glob để liệt kê `trion-doc/docs/screens/DETAILED_DESIGN_*.md` và nhắm đến tất cả file
- Khi chỉ định `--all`, tổng hợp kết quả review tất cả file vào **một comment duy nhất** để đăng
- Nếu tài liệu thiết kế chi tiết ghi rõ "không cần gọi API", bỏ qua đối chiếu với OpenAPI và ghi rõ điều đó trong comment
- Nếu tài liệu đặc tả OpenAPI ở dạng YAML, chỉ định `trion-doc/docs/public/openapi.yaml`
- Nếu có tham chiếu schema bằng `$ref`, cũng tham chiếu section `components` để xác nhận định nghĩa field thực tế
- Comment được viết bằng **tiếng Việt**
