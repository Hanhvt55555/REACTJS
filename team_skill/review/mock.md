# Skill Review — Kiểm tra Mockup

## Mục đích

Đối chiếu các React component trong PR của repository `trion-frontend` với Wireframe spec (PDF), xác nhận xem các thành phần UI chính và field có được triển khai hay không.

## Cú pháp gọi

```text
/review:mock <PR_URL> [--spec <spec_file>] [--files <file1> ...]
```

- `PR_URL`: URL PR trên GitHub (ví dụ: `https://github.com/org/trion-frontend/pull/45`)
- `--spec`: Đường dẫn local của Wireframe spec PDF (nếu bỏ qua sẽ tự động chọn từ file thay đổi trong PR)
- `--files`: Đường dẫn file cần review (nếu bỏ qua sẽ tự động lấy từ file thay đổi trong PR)

**Ví dụ:**

```bash
# Hoàn toàn tự động (phát hiện file thay đổi trong PR và tự động chọn PDF)
/review:mock https://github.com/org/trion-frontend/pull/45

# Chỉ định PDF rõ ràng
/review:mock https://github.com/org/trion-frontend/pull/45 \
  --spec "trion-doc/docs/public/requirements/マイページ（職員）.pdf"

# Chỉ định cả file và PDF
/review:mock https://github.com/org/trion-frontend/pull/45 \
  --spec "trion-doc/docs/public/requirements/マイページ（職員）.pdf" \
  --files trion-frontend/src/pages/MyPage.tsx
```

---

## Quy trình thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `PR_URL`: URL đầy đủ của PR
- `--spec`: Đường dẫn local của Wireframe spec PDF (tùy chọn)
- `--files`: Đường dẫn file cần review (tùy chọn)

Nếu thiếu `PR_URL`, hiển thị thông báo lỗi và cú pháp đúng rồi dừng xử lý.

### Bước 2 — Lấy thông tin PR và kiểm tra comment cũ (thực thi song song)

**Thực thi đồng thời 2 lệnh sau (song song):**

```bash
# [A] Lấy thông tin PR
gh pr view <PR_URL> --json number,title,headRefName,headRepository,files

# [B] Lấy comment review cũ (chỉ trích xuất dòng ❌/⚠️ để tiết kiệm token)
gh api repos/<owner/repo>/issues/<PR番号>/comments \
  --jq '[.[] | select(.body | contains("review-mock") or contains("Review Mockup"))
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

※ Số PR được trích xuất trực tiếp từ PR_URL (ví dụ: `.../pull/13` → `13`). Có thể thực thi [B] mà không cần chờ [A] hoàn tất.

Từ [A] trích xuất các thông tin:
- `headRefName`: Tên branch của PR
- `headRepository.nameWithOwner`: `owner/repo`
- `files[].path` và `files[].changeType`: Danh sách file thay đổi trong PR và loại thay đổi

### Bước 2.5 — Kiểm tra comment review cũ

Sử dụng kết quả [B] ở trên.

Nếu tồn tại comment review cũ (do skill `/review:mock`):

1. Trích xuất và xác nhận các dòng vấn đề được phát hiện (❌・⚠️) từ comment review mới nhất
2. Đối chiếu với nội dung file hiện tại trên branch, xác định từng vấn đề đã được sửa hay chưa
3. Thêm section sau vào **đầu** phần preview ở bước 8:

```markdown
### 📝 Xác nhận sửa chữa vấn đề lần trước

| Nội dung vấn đề | Trạng thái |
|---|---|
| <Tóm tắt nội dung vấn đề> | ✅ Đã sửa / ❌ Chưa sửa |
```

4. **Không review lại các file đã được review trước đó.** Từ bước 3~7 trở đi, chỉ xử lý các file mới được thêm vào hoặc thay đổi trong PR sau comment review lần trước. Bỏ qua các file đã được review trong comment cũ.

Nếu không có comment review cũ, bỏ qua bước này và review toàn bộ file như bình thường.

### Bước 3 — Xác định file cần review

Nếu `--files` được chỉ định thì sử dụng giá trị đó.

Nếu bỏ qua, tự động trích xuất các file `.tsx` / `.jsx` / `.ts` / `.js` nằm trong `src/pages/` hoặc `src/components/` từ danh sách file thay đổi trong PR (`files[].path`). **Loại trừ các file đã được xác định là đã review ở bước 2.5.**

```bash
gh pr view <PR_URL> --json files --jq '.files[].path' | grep -E '\.(tsx|jsx|ts|js)$' | grep -E 'src/(pages|components)/'
```

Nếu không có file nào, hiển thị "Không tìm thấy file source cần review" rồi dừng xử lý.

### Bước 4 — Tự động chọn PDF tương ứng

Nếu `--spec` được chỉ định thì sử dụng giá trị đó.

Nếu bỏ qua, tự động chọn PDF tương ứng từ đường dẫn file cần review (tên file, tên thư mục) theo bảng mapping sau:

| Keyword trong đường dẫn file | PDF tương ứng |
|------------------------|---------|
| `Login`, `login` + `staff`/`shokuin` | `ログイン画面（職員）.pdf` |
| `Login`, `login` + `business`/`jigyosha` | `ログイン画面（事業者）.pdf` |
| `Login`, `login` (không phân biệt được) | Cả `ログイン画面（職員）.pdf` và `ログイン画面（事業者）.pdf` |
| `Register`, `register`, `NewAccount`, `new-account` | `新規登録申請.pdf` |
| `Mypage`, `MyPage`, `mypage` + `staff` | `マイページ（職員）.pdf` |
| `Mypage`, `MyPage`, `mypage` + `business` | `マイページ（事業者）.pdf` |
| `Mypage`, `MyPage`, `mypage` (không phân biệt được) | Cả `マイページ（職員）.pdf` và `マイページ（事業者）.pdf` |
| `AccountInfoMenu`, `account-info-menu` | `アカウント情報メニュー.pdf` |
| `AccountInfo`, `account-info` + `staff` | `アカウント情報確認（職員）.pdf` |
| `AccountInfo`, `account-info` + `business` | `アカウント情報確認（事業者）.pdf` |
| `Contract`, `contract`, `Keiyaku`, `keiyaku` + `menu` + `staff` | `契約メニュー（職員）.pdf` |
| `Contract`, `contract`, `Keiyaku`, `keiyaku` + `menu` + `business` | `契約メニュー（事業者）.pdf` |
| `Contract`, `contract`, `Keiyaku`, `keiyaku` + `list` + `staff` | `契約一覧（職員）.pdf` |
| `Contract`, `contract`, `Keiyaku`, `keiyaku` + `list` + `business` | `契約一覧（事業者）.pdf` |
| `ContractApplication`, `moushikomi` + `list` + `staff` | `契約申込一覧（職員）.pdf` |
| `ContractApplication`, `moushikomi` + `list` + `business` | `契約申込一覧（事業者）.pdf` |
| `NewContractApplication`, `shinki-keiyaku` | `新規契約申込.pdf` |
| `ChangeContractApplication`, `henkou-keiyaku` | `変更契約申込.pdf` |
| `ContractChange`, `moushikomi-henkou` + `new` | `契約申込変更（新規）.pdf` |
| `ContractChange`, `moushikomi-henkou` + `change` | `契約申込変更（変更）.pdf` |
| `Delivery`, `delivery`, `Hannyuu`, `hannyuu` + `menu` + `staff` | `搬入メニュー（職員）.pdf` |
| `Delivery`, `delivery`, `Hannyuu`, `hannyuu` + `menu` + `business` | `搬入メニュー（事業者）.pdf` |
| `DeliverySchedule`, `CarryinPlan` + `staff` | `搬入予定表（職員）.pdf` |
| `DeliverySchedule`, `CarryinPlan` + `business` | `搬入予定表（事業者）.pdf` |
| `DeliveryAvailable`, `hannyuu-kanou` | `搬入予定表の搬入可能日時.pdf` |
| `DeliveryReservationInput`, `hannyuu-yoyaku-input` | `搬入予約入力.pdf` |
| `DeliveryReservationConfirm`, `hannyuu-yoyaku-confirm` | `搬入予約確認.pdf` |
| `DeliveryReception`, `hannyuu-uketsuke` | `搬入受付.pdf` |
| `DeliveryResults`, `hannyuu-jisseki` + `staff` | `搬入実績一覧（職員）.pdf` |
| `DeliveryResults`, `hannyuu-jisseki` + `business` | `搬入実績一覧（事業者）.pdf` |
| `DeliveryVehicleRegistration`, `hannyuu-sharyou` | `搬入車両登録申請.pdf` |
| `ReservationDeadline`, `yoyaku-kigen` | `予約入力・変更期限.pdf` |
| `Settlement`, `settlement`, `Seisan`, `seisan` + `staff` | `精算メニュー（職員）.pdf` |
| `Settlement`, `settlement`, `Seisan`, `seisan` + `business` | `精算メニュー（事業者）.pdf` |
| `Password`, `password`, `ChangePassword` | `パスワード変更.pdf` |
| `BusinessInfoMenu`, `jigyousha-jouhou-menu` + `staff` | `事業者情報メニュー（職員）.pdf` |
| `BusinessInfoMenu`, `jigyousha-jouhou-menu` + `business` | `事業者情報メニュー（事業者）.pdf` |
| `BusinessInfoRegister`, `jigyousha-jouhou-touroku` | `事業者情報登録.pdf` |
| `BusinessInfoApplicationList`, `jigyousha-shinsei-list` | `事業者情報申請一覧.pdf` |
| `BusinessInfoApplicationChange`, `jigyousha-shinsei-henkou` | `事業者情報申請変更.pdf` |
| `ChangeNotification`, `henkou-todoke` + `haishutsu` | `変更届（排出事業者）.pdf` |
| `ChangeNotification`, `henkou-todoke` + `shuushuu` | `変更届（収集運搬業者）.pdf` |
| `DischargeOperators`, `haishutsu-jigyousha` + `list` | `排出事業者一覧.pdf` |
| `DischargeOperators`, `haishutsu-jigyousha` + `application-list` | `排出事業者申請一覧.pdf` |
| `DischargeOperators`, `haishutsu-jigyousha` + `vehicle-list` | `排出事業者登録車両一覧.pdf` |
| `DischargeOperators`, `haishutsu-jigyousha` + `vehicle-application` | `排出事業者車両登録申請一覧.pdf` |
| `TransportOperators`, `shuushuu-unpan` + `list` | `収集運搬業者一覧.pdf` |
| `TransportOperators`, `shuushuu-unpan` + `application-list` | `収集運搬業者申請一覧.pdf` |
| `TransportOperators`, `shuushuu-unpan` + `vehicle-list` | `収集運搬業者登録車両一覧.pdf` |
| `TransportOperators`, `shuushuu-unpan` + `vehicle-application` | `収集運搬業者車両登録申請一覧.pdf` |
| `VehicleList`, `touroku-sharyou-list` | `登録車両一覧.pdf` |
| `VehicleChangeApplication`, `touroku-sharyou-henkou` | `登録車両変更申請.pdf` |
| `VehicleApplicationList`, `sharyou-touroku-shinsei-list` | `車両登録申請一覧.pdf` |
| `VehicleApplicationChange`, `sharyou-touroku-shinsei-henkou` | `車両登録申請変更.pdf` |
| `Statistics`, `toukei` | `統計メニュー.pdf` |
| `Management`, `kanri` | `管理メニュー.pdf` |
| `StaffAccountList`, `shokuin-account` | `職員アカウント一覧.pdf` |
| `SafetyTrainingMenu`, `anzen-kanri-menu` | `安全管理講習メニュー.pdf` |
| `SafetyTrainingVideo`, `anzen-kanri-video` | `安全管理講習の動画ページ.pdf` |
| `SafetyTrainingTest`, `anzen-kanri-test` | `安全管理講習の確認テスト.pdf` |
| `WasteItemList`, `haikibutsu-hinmoku-list` | `廃棄物品目一覧.pdf` |
| `WasteItemRegister`, `haikibutsu-hinmoku-touroku` | `廃棄物品目登録.pdf` |
| `WasteItemDetail`, `haikibutsu-hinmoku-detail` | `廃棄物品目詳細.pdf` |
| `DailyReport`, `nippou` | `日報出力.pdf` |
| `MonthlyReport`, `geppou` | `月報出力.pdf` |
| `AnnualReport`, `nenpou` | `年報出力.pdf` |
| `InspectionReport`, `houkokusho-shidou` | `報告書・指導記録一覧.pdf` |
| `SiteCheckResult`, `genchi-kakunin` | `現地確認結果一覧.pdf` |
| `ElutionTest`, `kan-i-youshutsu` | `簡易溶出試験結果登録.pdf` |
| `FluorescentXrayTest`, `keikou-xsen` | `蛍光X線検査結果登録.pdf` |

Đường dẫn PDF là `trion-doc/docs/public/requirements/<filename>`.

Khi nhiều file tương ứng với các màn hình khác nhau, nhóm PDF và file theo từng màn hình và review từng nhóm riêng.

Nếu không xác định được PDF tương ứng, hiển thị "Không thể xác định Wireframe PDF tương ứng. Vui lòng chỉ định bằng `--spec`" rồi dừng xử lý.

### Bước 5 — Đọc Wireframe spec

Đọc trực tiếp PDF đã xác định ở bước 4 từ `trion-doc/docs/public/requirements/<filename>` bằng công cụ Read.

```text
Read tool → trion-doc/docs/public/requirements/<Tên file PDF>
```

Khi đọc, xử lý toàn bộ trang của PDF (với PDF dung lượng lớn, chia phạm vi trang bằng tham số `pages`).

Trích xuất các thông tin sau từ PDF để sử dụng làm Wireframe spec:

1. Danh sách phần tử hiển thị, field, button, label (bao gồm số thứ tự)
2. Cấu trúc layout, section, grouping
3. Luồng thao tác, điều hướng màn hình, modal, dialog
4. Danh sách validation, thông báo lỗi

Nếu PDF không tồn tại, ghi lại "Không tìm thấy Wireframe PDF tại local" rồi dừng xử lý.

### Bước 6 — Lấy file từ branch PR

Với mỗi file cần review, chuyển đổi phương thức lấy tương ứng với loại thay đổi trong PR (`changeType`). **Phải giữ lại số dòng của nội dung đã lấy để xác định vị trí dòng của vấn đề được phát hiện.**

**ADDED (mới thêm) — Lấy toàn bộ nội dung (kèm số dòng):**
```bash
gh api "repos/<owner/repo>/contents/<file_path>?ref=<branch>" --jq '.content' | base64 -d | cat -n
```

**MODIFIED (sửa đổi hiện có) — Chỉ lấy diff (tiết kiệm token):**
```bash
gh api repos/<owner/repo>/pulls/<PR番号>/files \
  --jq '.[] | select(.filename=="<file_path>") | .patch'
```

Tính số dòng phía file mới từ hunk `@@ -old,+new_start,new_count @@` của diff. Các phần hiện có không thay đổi được xử lý như đã review lần trước.

Nếu chỉ có diff mà không đủ context xung quanh, có thể lấy toàn bộ nội dung như ADDED để xác nhận số dòng.

Nếu file không tồn tại trên branch, ghi lại "Không tìm thấy trong PR" rồi tiếp tục xử lý các file khác.

### Bước 7 — So sánh và phân tích

Với mỗi file đã lấy, đối chiếu với Wireframe spec theo các quan điểm sau.

**Quan điểm review (trọng tâm):**

1. **Tính đầy đủ của các phần tử**: Tất cả field, label, button, section được ghi trong Wireframe có được triển khai không
2. **Layout**: Vị trí, thứ tự, grouping của các phần tử có khớp với Wireframe không (căn giữa, căn trái/phải, cấu trúc section, v.v.)
3. **Tính đúng đắn của điều hướng màn hình**: Điểm đến điều hướng của button và link, đóng/mở modal, luồng điều hướng có khớp với Wireframe không

**Không thuộc phạm vi review:**

- Code style, format
- Logic validation (xử lý kiểm tra giá trị input)
- Độ chính xác của thông báo lỗi chi tiết
- Business logic
- Chỉ định màu cụ thể (trừ khi được ghi rõ trong Wireframe)
- Hành vi responsive
- Thiết kế code, kiến trúc (tính hợp lệ của import, thiết kế kiểu dữ liệu, quy ước đặt tên, v.v.)
- Các lỗi kiểu dữ liệu và label map không có vấn đề trên màn hình mock hiện tại (những vấn đề chỉ xuất hiện khi có dữ liệu thực)

**Tiêu chí đánh giá:** So sánh Wireframe PDF và triển khai theo quan điểm giao diện (UI), **chỉ chỉ ra các sai lệch có thể xác nhận trực quan trên màn hình mock hiện tại**. Không chỉ ra các vấn đề thiết kế nội tại của code hoặc các lỗi tiềm ẩn không tái hiện được với dữ liệu mock hiện tại.

**Xác định vị trí vấn đề được phát hiện:** Với mỗi vấn đề (❌・⚠️), phải ghi lại **đường dẫn file và số dòng** (hoặc phạm vi dòng) của code tương ứng.

- Trường hợp một dòng: `src/pages/MyPage.tsx:42`
- Trường hợp phạm vi: `src/pages/MyPage.tsx:42-58`
- Trường hợp "chưa triển khai" và không có code tương ứng: chỉ ra vị trí gần nhất liên quan (component cha, section, dòng bắt đầu của phần trả về JSX, v.v.) bằng số dòng. Nếu không xác định được số dòng, ghi `src/pages/MyPage.tsx` (chỉ tên file).

### Bước 8 — Preview nội dung review và xác nhận

Trước tiên, hiển thị kết quả review cho người dùng theo định dạng sau bằng **tiếng Nhật**.

**Quan trọng:** Khi review nhiều màn hình cùng lúc, **phân chia section theo từng màn hình** để thấy ngay file nào thuộc màn hình nào. Mỗi section màn hình phải ghi rõ Wireframe PDF tương ứng và danh sách file thuộc màn hình đó.

````markdown
## 🔍 モックアップレビュー

---

## 📄 <画面名1>

**参照Spec:** `<spec1.pdf のパス>`
**レビュー対象ファイル:**
- `<file1>`
- `<file2>`

### `<file1>`

#### ❌ 未実装・不足
- **[`<file1>:<行番号>`]** <未実装の要素>

#### ⚠️ 要確認
- **[`<file1>:<行番号>`]** <確認が必要な要素>

（❌・⚠️ の両方が空の場合は「✅ 指摘なし」と表示する）

### `<file2>`

✅ 指摘なし

---

## 📄 <画面名2>

**参照Spec:** `<spec2.pdf のパス>`
**レビュー対象ファイル:**
- `<file3>`

### `<file3>`

...
````

- Tên màn hình sử dụng tiêu đề của Wireframe PDF (ví dụ: `83.基準値設定` → "基準値設定")
- Khi một màn hình có nhiều file (trang chính + modal, v.v.), xếp chung dưới cùng section `## 📄 <画面名>`
- Ghi **đường dẫn file:số dòng** (hoặc phạm vi dòng `số dòng-số dòng`) của code tương ứng ở đầu mỗi vấn đề, bao quanh bằng dấu backtick. Nếu không xác định được số dòng thì chỉ ghi tên file
- Dù chỉ có 1 màn hình cũng sử dụng cùng định dạng (chỉ viết 1 `## 📄 <画面名>`)

Sau khi hiển thị preview tiếng Nhật, **phải hiển thị thông báo xác nhận sau bằng tiếng Nhật và chờ người dùng phê duyệt**:

> 上記の内容を PR にコメントとして投稿してよいですか？

Nếu người dùng phê duyệt, đăng bằng định dạng sau đã dịch sang **tiếng Việt** để đăng. Giống như preview tiếng Nhật, **phân chia section theo từng màn hình**.

````markdown
## 🔍 Review Mockup

---

## 📄 <画面名1>

**Spec tham chiếu:** `<spec1.pdf のパス>`
**File được review:**
- `<file1>`
- `<file2>`

### `<file1>`

#### ❌ Thiếu
- **[`<file1>:<行番号>`]** <未実装内容をベトナム語で>

#### ⚠️ Cần xác nhận
- **[`<file1>:<行番号>`]** <要確認内容をベトナム語で>

（❌・⚠️ の両方が空の場合は「✅ Không có vấn đề」と表示する）

### `<file2>`

✅ Không có vấn đề

---

## 📄 <画面名2>

**Spec tham chiếu:** `<spec2.pdf のパス>`
**File được review:**
- `<file3>`

### `<file3>`

...

---

> 🤖 Review tự động bởi `/review:mock` skill
````

- Tên màn hình sử dụng tiêu đề Wireframe PDF giống như preview tiếng Nhật (không dịch sang tiếng Việt)

Trong comment tiếng Việt cũng ghi `[`<đường dẫn file>:<số dòng>`]` ở đầu mỗi vấn đề.

```bash
gh pr comment <PR_URL> --body "<Nội dung comment tiếng Việt>"
```

Nếu người dùng từ chối hoặc yêu cầu chỉnh sửa, sửa lại **preview tiếng Nhật** theo hướng dẫn rồi xác nhận lại.

---

## Lưu ý

- Khi bỏ qua `--files`, tự động trích xuất `.tsx/.jsx/.ts/.js` từ file thay đổi trong PR
- Khi bỏ qua `--spec`, tự động chọn PDF tương ứng từ keyword trong đường dẫn file
- PDF (`--spec`) luôn được đọc bằng công cụ Read từ local `trion-doc/docs/public/requirements/`
- Khi review nhiều file, tổng hợp vào **1 comment duy nhất**, phân chia section theo từng file
- Comment được viết bằng **tiếng Việt**
