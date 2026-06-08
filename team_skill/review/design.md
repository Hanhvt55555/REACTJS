# Skill Review — Kiểm tra tính nhất quán của Thiết kế chi tiết

## Mục đích

Đối chiếu tài liệu thiết kế chi tiết (`DETAILED_DESIGN_*.md`) với các tài liệu gốc (wireframe · OpenAPI · sơ đồ chuyển màn hình · định nghĩa code · RBAC) để xác nhận nội dung thiết kế có chính xác và đủ thông tin để triển khai hay không.

> **Phạm vi**: Review thiết kế được thực hiện TRƯỚC khi bắt đầu dev. Đối chiếu với mockup KHÔNG nằm trong phạm vi này.

## Cú pháp gọi

```text
/review:design <PR_URL> [--design <design_file>]
               [--spec <wireframe.pdf>] [--transition <遷移図.md>]
               [--openapi <openapi.yaml>] [--code-def <code_def.md>]
               [--rbac <rbac.md>] [--table <schema.md>]
```

- `PR_URL`: URL của GitHub PR (ví dụ: `https://github.com/org/trion-docs/pull/88`)
- `--design`: Đường dẫn local của tài liệu thiết kế chi tiết (nếu bỏ qua sẽ tự động chọn từ file thay đổi trong PR)
- `--spec`: PDF wireframe (nếu bỏ qua sẽ tự động chọn từ `requirements\` theo keyword mapping)
- `--transition`: Sơ đồ chuyển màn hình (nếu bỏ qua sẽ dùng `team_skill\資料\資料8_画面遷移図.md`)
- `--openapi`: Tài liệu OpenAPI (nếu bỏ qua sẽ dùng `openapi.yaml`)
- `--code-def`: File định nghĩa code (nếu bỏ qua sẽ dùng `team_skill\資料\資料15_コード定義.md`)
- `--rbac`: Sơ đồ RBAC (nếu bỏ qua sẽ dùng `team_skill\資料\RBAC図.md`)
- `--table`: Định nghĩa schema (nếu bỏ qua sẽ dùng `team_skill\資料\資料14_スキーマ定義.md`)

**Ví dụ:**

```bash
# Tự động hoàn toàn
/review:design https://github.com/org/trion-docs/pull/88

# Chỉ định rõ file thiết kế
/review:design https://github.com/org/trion-docs/pull/88 \
  --design trion-docs/docs/screens/DETAILED_DESIGN_NO_16_ACCOUNT_INFO_CONFIRM_JIGYOSHA.md
```

---

## Quy trình thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `PR_URL`: URL đầy đủ của PR (bắt buộc — nếu thiếu thì dừng xử lý)
- `--design`: Đường dẫn local tài liệu thiết kế (tùy chọn)
- `--spec`: Đường dẫn local PDF wireframe (tùy chọn)
- `--transition`: Đường dẫn local sơ đồ chuyển màn hình (tùy chọn)
- `--openapi`: Đường dẫn local tài liệu OpenAPI (tùy chọn)
- `--code-def`: Đường dẫn local file định nghĩa code (tùy chọn)
- `--rbac`: Đường dẫn local sơ đồ RBAC (tùy chọn)
- `--table`: Đường dẫn local định nghĩa schema (tùy chọn)

**Giá trị mặc định khi bỏ qua:**

| Flag           | Mặc định                                                                                           | Nếu không tồn tại                      |
| -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `--spec`       | Tự động chọn từ `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\requirements\` theo keyword mapping | Hỏi user                               |
| `--transition` | `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料8_画面遷移図.md`                | Bỏ qua kiểm tra B.1/B.6                |
| `--openapi`    | `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\trion-docs\docs\public\openapi.yaml`                | Hỏi user                               |
| `--code-def`   | `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料15_コード定義.md`               | Bỏ qua kiểm tra enum B.2               |
| `--rbac`       | `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\RBAC図.md`                          | Báo ⚠️ "Chưa đối chiếu RBAC図" tại B.8 |
| `--table`      | `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料14_スキーマ定義.md`             | Bỏ qua kiểm tra schema B.2             |

---

### Bước 2 — Lấy thông tin PR và kiểm tra comment cũ (chạy song song)

**Thực thi đồng thời 2 lệnh sau (song song):**

```bash
# [A] Lấy thông tin PR
gh pr view <PR_URL> --json number,title,headRefName,headRepository,files

# [B] Lấy comment review cũ
gh api repos/<owner/repo>/issues/<PR số>/comments \
  --jq '[.[] | select(.body | contains("review-design") or contains("Review thiết kế"))
         | {id: .id, created_at: .created_at,
            issues: (.body | split("\n")
              | map(select(startswith("- ❌") or startswith("- ⚠️") or
                          (contains("❌") and contains("|")) or
                          (contains("⚠️") and contains("|"))))
              | join("\n"))}]'
```

※ Số PR được trích xuất trực tiếp từ PR_URL. Có thể thực thi [B] mà không cần chờ [A] hoàn thành.

Trích xuất các thông tin sau từ [A]:

- `headRefName`: Tên branch của PR
- `headRepository.nameWithOwner`: `owner/repo`
- `files[].path` và `files[].changeType`: Danh sách file thay đổi trong PR và loại thay đổi

### Bước 2.5 — Kiểm tra comment review cũ

Nếu tồn tại comment `/review:design` cũ:

1. Trích xuất các chỉ ra ❌/⚠️ từ comment mới nhất
2. Đối chiếu với nội dung file hiện tại trên branch, xác định đã sửa/chưa sửa
3. Thêm section "📝 Xác nhận sửa chỉ ra lần trước" vào đầu kết quả bước 6
4. Không review lại các file đã review trước đó

---

### Bước 3 — Xác định và đọc tài liệu thiết kế chi tiết

#### Xác định file thiết kế

Nếu `--design` được chỉ định thì dùng luôn.

Nếu bỏ qua, tự động trích xuất file `DETAILED_DESIGN_*.md` từ các file thay đổi trong PR:

```bash
gh pr view <PR_URL> --json files --jq '.files[].path' | grep -E 'DETAILED_DESIGN_.*\.md$'
```

Nếu không tìm thấy file thiết kế trong PR, dừng xử lý và hướng dẫn user chỉ định bằng `--design`.

#### Đọc nội dung file thiết kế

Chọn cách lấy tùy theo loại thay đổi trong PR:

**ADDED (thêm mới) — lấy toàn bộ nội dung:**

```bash
gh api "repos/<owner/repo>/contents/<file_path>?ref=<branch>" --jq '.content' | base64 -d
```

**MODIFIED (sửa đổi) — chỉ lấy diff:**

```bash
gh api repos/<owner/repo>/pulls/<PR số>/files \
  --jq '.[] | select(.filename=="<file_path>") | .patch'
```

Sau khi đọc, trích xuất và nắm bắt các thông tin sau từ tài liệu:

- [A] Đối tượng người dùng và mục đích màn hình
- B.0 Route · sessionStorage key
- B.1 API sử dụng · màn hình nguồn/đích
- B.2 Danh sách field (tên · nguồn dữ liệu · giá trị enum · điều kiện hiển thị)
- B.3 Quy tắc validate · danh sách error code
- B.4 Luồng xử lý (thứ tự bước · điều kiện phân nhánh)
- B.5 Định nghĩa Request/Response
- B.6 Định nghĩa chuyển màn hình khi có lỗi
- B.8 Phân quyền truy cập (role)
- [C] Điểm chưa xác nhận/tạm hoãn và mức độ ưu tiên

---

### Bước 4 — Giải quyết và đọc các file tài liệu phụ

#### `--spec` (PDF wireframe)

Nếu `--spec` bị bỏ qua, chọn PDF tương ứng từ tên file thiết kế theo bảng mapping sau.
Base path: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\requirements\`

| Keyword trong tên file thiết kế                                             | Màn hình No | PDF tương ứng                                                   |
| --------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| `NO_1_2_LOGIN` hoặc `LOGIN`                                                 | 1, 2        | `01.ログイン画面（職員）.pdf` + `02.ログイン画面（事業者）.pdf` |
| `NO_3_MYPAGE_STAFF`                                                         | 3           | `03.マイページ（職員）.pdf`                                     |
| `NO_4_MYPAGE_BUSINESS`                                                      | 4           | `04.マイページ（事業者）.pdf`                                   |
| `NO_5_ACCOUNT_INFO_MENU`                                                    | 5           | `05.アカウント情報メニュー.pdf`                                 |
| `NO_6_JIGYOUSHA_JOUHOU_MENU_BUSINESS`                                       | 6           | `06.事業者情報メニュー（事業者）.pdf`                           |
| `NO_7_JIGYOUSHA_JOUHOU_MENU_STAFF`                                          | 7           | `07.事業者情報メニュー（職員）.pdf`                             |
| `NO_7_8_KEIYAKU_MENU` hoặc `NO_8_CONTRACT_MENU_STAFF`                       | 8           | `08.契約メニュー（職員）.pdf`                                   |
| `NO_9_CONTRACT_MENU_BUSINESS`                                               | 9           | `09.契約メニュー（事業者）.pdf`                                 |
| `NO_9_10_HANNYUU_MENU` hoặc `NO_10_HANNYUU_MENU_STAFF`                      | 10          | `10.搬入メニュー（職員）.pdf`                                   |
| `NO_11_HANNYUU_MENU_BUSINESS`                                               | 11          | `11.搬入メニュー（事業者）.pdf`                                 |
| `NO_11_12_SEISAN_MENU` hoặc `NO_12_SEISAN_MENU_STAFF`                       | 12          | `12.精算メニュー（職員）.pdf`                                   |
| `SEISAN_MENU` + `BUSINESS`                                                  | 13          | `13.精算メニュー（事業者）.pdf`                                 |
| `NO_14_TOUKEI_MENU`                                                         | 14          | `14.統計メニュー.pdf`                                           |
| `NO_15_KANRI_MENU`                                                          | 15          | `15.管理メニュー.pdf`                                           |
| `NO_15_ACCOUNT_INFO_CONFIRM_SHOKUIN` hoặc `ACCOUNT_INFO_CONFIRM_SHOKUIN`    | 16          | `16.アカウント情報確認画面（職員）.pdf`                         |
| `NO_16_ACCOUNT_INFO_CONFIRM_JIGYOSHA` hoặc `ACCOUNT_INFO_CONFIRM_JIGYOSHA`  | 17          | `17.アカウント情報確認画面（事業者）.pdf`                       |
| `NO_17_CHANGE_PASSWORD` hoặc `CHANGE_PASSWORD`                              | 18          | `18.パスワード変更画面.pdf`                                     |
| `SAFETY_TRAINING_MENU`                                                      | 19          | `19.安全管理講習メニュー.pdf`                                   |
| `SAFETY_TRAINING_VIDEO`                                                     | 20          | `20.安全管理講習の動画ページ.pdf`                               |
| `SAFETY_TRAINING_TEST`                                                      | 21          | `21.安全管理講習の確認テスト.pdf`                               |
| `NO_21_SHINKI_TOROKU_SHINSEI`                                               | 22          | `22.新規登録申請.pdf`                                           |
| `NO_22_JIGYOUSHA_JOUHOU_TOROKU`                                             | 23          | `23.事業者情報登録.pdf`                                         |
| `NO_23_SHINKI_KEIYAKU_MOUSHIKOMI`                                           | 24          | `24.新規契約申込.pdf`                                           |
| `NO_24_HENKOU_KEIYAKU_MOUSHIKOMI`                                           | 25          | `25.変更契約申込.pdf` (nếu không tồn tại thì bỏ qua)            |
| `NO_25_HENKOU_TODOKEDESHO_HAISHUTSU`                                        | 26          | `26.変更届（排出事業者）.pdf`                                   |
| `NO_26_HENKOU_TODOKEDESHO_SHUUSHUU`                                         | 27          | `27.変更届（収集運搬業者）.pdf`                                 |
| `NO_28_HANNYUU_SHARYOU_TOUROKU_MOUSHIKOMI`                                  | 28          | `28.搬入車両登録申請.pdf`                                       |
| `NO_28_29_JIGYOUSHA_SHINSEI_LIST_STAFF`                                     | 29          | `29.排出事業者一覧（職員）.pdf`                                 |
| `NO_30_KEIYAKU_MOUSHIKOMI_LIST_STAFF`                                       | 35, 93      | `35.契約一覧（職員）.pdf`                                       |
| `NO_36_KEIYAKU_MOUSHIKOMI_DETAIL_STAFF`                                     | 36          | `35.契約一覧（職員）.pdf` (màn hình chi tiết)                   |
| `NO_42_43_JIGYOUSHA_SHINSEI_LIST_BUSINESS`                                  | 42          | `42.事業者情報申請一覧（事業者）.pdf`                           |
| `NO_44_45_HANNYUU_SCHEDULE`                                                 | 52, 53      | `52.搬入予定表（職員）.pdf` + `53.搬入予定表（事業者）.pdf`     |
| `NO_46_HANNYUU_RESERVATION_INPUT`                                           | 54          | `54.搬入予約入力.pdf`                                           |
| `NO_47_HANNYUU_RESERVATION_CONFIRM`                                         | 55          | `55.搬入予約確認.pdf`                                           |
| `NO_94` hoặc `SHARYOU_TOROKU_SHINSEI_LIST_BUSINESS`                         | 94          | `94.車両登録申請一覧（事業者）.pdf`                             |
| `NO_95` hoặc `KEIYAKU_MOUSHIKOMI_LIST_BUSINESS`                             | 45, 95      | `45.契約一覧（事業者）.pdf`                                     |

Nếu không xác định được PDF tương ứng, hỏi user chỉ định bằng `--spec`.

#### `--transition` (Sơ đồ chuyển màn hình)

Mặc định: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料8_画面遷移図.md`

Đọc trực tiếp bằng Read tool. Nếu không tồn tại, bỏ qua kiểm tra B.1/B.6.

#### `--openapi` (Tài liệu OpenAPI)

Mặc định: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\trion-docs\docs\public\openapi.yaml`
Nếu không tồn tại thì hỏi user. Nếu bỏ qua thì skip kiểm tra B.1/B.5.

#### `--code-def` (File định nghĩa code)

Mặc định: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料15_コード定義.md`

Đọc trực tiếp bằng Read tool. Nếu không tồn tại, bỏ qua kiểm tra enum B.2.

#### `--rbac` (Sơ đồ RBAC)

Mặc định: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\RBAC図.md`

Đọc trực tiếp bằng Read tool. Nếu không tồn tại, báo ⚠️ "Chưa đối chiếu RBAC図" tại B.8.

#### `--table` (Định nghĩa schema)

Mặc định: `C:\Users\hanhh\OneDrive\Desktop\TRION\Project\team_skill\資料\資料14_スキーマ定義.md`

Đọc trực tiếp bằng Read tool. Nếu không tồn tại, bỏ qua kiểm tra schema B.2.

---

### Bước 5 — Thực hiện review (kiểm tra từng section của thiết kế theo thứ tự)

> Nếu tài liệu thiết kế không có nội dung cho section đó, bỏ qua và ghi "Không có nội dung".
> **Khi phát hiện vấn đề**: ghi rõ **số dòng** (`L.xxx`) trong file thiết kế để người sửa có thể navigate trực tiếp. Dùng Read tool để xác nhận số dòng trước khi ghi vào báo cáo.

---

#### 5.A — Kiểm tra [A] Tổng quan

Đọc section [A] của thiết kế và xác nhận:

1. **Mục đích màn hình**: Có ghi rõ vai trò màn hình ("đọc/chỉnh sửa/nộp đơn" v.v.) không?
2. **Đối tượng người dùng**: Có ghi rõ 職員/事業者/role cụ thể không?
3. **Phân nhánh theo loại user**: Nếu xử lý nhiều loại user (ví dụ: 排出/収集運搬), có ghi rõ sự khác biệt của từng loại trong [A] không?

---

#### 5.B0 — Kiểm tra Route & sessionStorage

Đọc B.0 của thiết kế và xác nhận:

1. **Định dạng Route path**: Route có được định nghĩa rõ ràng theo dạng `/shokuin/xxx` hoặc `/jigyosha/xxx` không? Có nhất quán với màn hình trước/sau (trùng với 遷移先 path trong B.1)?
2. **sessionStorage key**: Các key mà thiết kế tham chiếu có đúng quy tắc đặt tên không (ví dụ: `authToken`, `loginType`)? Có tương ứng với giá trị lấy từ response trong B.5 không?

---

#### 5.B1 — Kiểm tra API & điều hướng màn hình

Đọc B.1 của thiết kế và đối chiếu:

**Kiểm tra API endpoint** (chỉ khi có `--openapi`):

1. API endpoint ghi trong B.1 (ví dụ: `GET /api/v1/auth/shokuin-info`) có được định nghĩa trong openapi.yaml không?
2. HTTP method có khớp không?
3. Nếu dùng API khác nhau cho từng loại user (ví dụ: 排出→`haisyuto-info`, 収集運搬→`syuusyuu-info`), điều kiện phân nhánh và API có được ghép đúng cặp không?

**Kiểm tra điều hướng màn hình** (chỉ khi có `--transition`):

4. "Màn hình nguồn" (遷移元) trong B.1 có khớp với sơ đồ chuyển màn hình không?
5. "Màn hình đích" (遷移先) trong B.1 có khớp với sơ đồ chuyển màn hình không?

---

#### 5.B2 — Kiểm tra danh sách field, điều kiện hiển thị, giá trị enum

Đọc B.2 của thiết kế và đối chiếu:

**Kiểm tra danh sách field** (khi có `--spec`):

1. Danh sách field trong B.2 có khớp với các item hiển thị trong wireframe không (không thừa thiếu)?
2. Có field nào có trong wireframe nhưng không ghi trong B.2, hoặc ngược lại không?

**Kiểm tra giá trị enum/code** (khi có `--code-def`):

3. Các field dùng enum trong B.2 (利用者区分・権限コード・所属区分・ステータス v.v.) có khớp với định nghĩa trong `--code-def` không?
4. Nếu không khớp thì báo ❌ (ví dụ: thiết kế ghi "職員=1" → code-def ghi "職員=2 (USR-0002)")

**Kiểm tra tên field / kiểu dữ liệu** (khi có `--table`):

5. Tên field và kiểu dữ liệu ghi trong B.2 có khớp với định nghĩa cột trong `--table` (資料14) không?
6. Có field nào ghi sai tên cột hoặc kiểu không tồn tại trong schema không?

**Kiểm tra điều kiện hiển thị**:

7. Điều kiện hiển thị theo loại user (ví dụ: chỉ hiển thị cho 排出, 収集運搬 hiển thị "対象外") có được ghi rõ cho từng field không?
8. Có field nào ghi điều kiện cho một loại user nhưng thiếu điều kiện cho loại kia không?

**Kiểm tra nguồn dữ liệu**:

9. Nguồn dữ liệu của từng field (lấy từ field nào trong API response / từ sessionStorage key nào) có được ghi rõ không?

---

#### 5.B3 — Kiểm tra validate & xử lý lỗi

Đọc B.3 của thiết kế và xác nhận:

**Validate phía client (B.3.1)** (khi có `--spec`):

1. Với mỗi input field có trong wireframe, quy tắc validate tương ứng (bắt buộc/độ dài/định dạng) có được định nghĩa trong B.3.1 không?
2. Cách hiển thị thông báo lỗi khi validate fail có được ghi không?

**Xử lý lỗi server (B.3.2)**:

3. Với API được dùng trong B.1, các error code phổ biến (400/401/403/404/409 v.v.) có được định nghĩa xử lý trong B.3.2 không? (khi có `--openapi`: kiểm tra thêm tính đầy đủ so với response schema)
4. Mapping giữa error code và thông báo hiển thị có được ghi rõ không?

---

#### 5.B4 — Kiểm tra tính nhất quán nội bộ của luồng xử lý

Đọc B.4 của thiết kế và xác nhận (đối chiếu nội bộ với các section khác trong thiết kế):

1. **Nhất quán API call**: Các API call ghi trong từng bước của B.4 có khớp với danh sách API sử dụng trong B.1 không?
2. **Nhất quán điều kiện phân nhánh**: Điều kiện phân nhánh ghi trong B.4 (loại user · giá trị flag v.v.) có khớp với định nghĩa field trong B.2 không?
3. **Nhất quán error flow**: Xử lý khi lỗi trong B.4 có mâu thuẫn với định nghĩa 遷移 lỗi trong B.6 không?
4. **Tính hợp lý của thứ tự flow**: Thứ tự các bước (ví dụ: xác thực → lấy dữ liệu → hiển thị màn hình) có logic không?

---

#### 5.B5 — Kiểm tra Input/Output

Đọc B.5 của thiết kế và đối chiếu với `--openapi` (chỉ thực hiện khi có `--openapi`):

**Kiểm tra Request**:

1. Tên field · kiểu dữ liệu · bắt buộc/tùy chọn trong Request của B.5 có khớp với requestBody schema trong OpenAPI không?
2. Giá trị enum ghi trong B.5 có khớp với định nghĩa OpenAPI không? (ví dụ: `'emitter'` vs `'haisyuto'`)
3. Cấu trúc field có khớp không? (B.5 định nghĩa 1 field nhưng API trả về nhiều field, v.v.)

**Kiểm tra Response**:

4. Tên field · kiểu dữ liệu trong Response của B.5 có khớp với responses schema trong OpenAPI không?
5. B.5 có ghi JSON sample không? (nếu không có thì báo ⚠️)

**Không kiểm tra**:

- Khác biệt naming convention (camelCase vs snake_case)
- Tính hợp lệ của giá trị trong sample data

---

#### 5.B6 — Kiểm tra điều hướng màn hình khi lỗi

Đọc B.6 của thiết kế và xác nhận:

**Đối chiếu với sơ đồ chuyển màn hình** (khi có `--transition`):

1. Màn hình đích được ghi trong B.6 ("Lỗi → chuyển đến màn hình XX") có khớp với định nghĩa trong sơ đồ chuyển màn hình không?
2. Các server error định nghĩa trong B.3.2 có tương ứng ghi trong B.6 không? (kiểm tra tính đầy đủ B.3.2 ↔ B.6)

**Tính hợp lý của "ở lại trang"**:

3. Các trường hợp định nghĩa "hiển thị thông báo lỗi và ở nguyên trang" trong B.6 có phù hợp không? (từ góc độ UX)

---

#### 5.B8 — Kiểm tra phân quyền · RBAC

Đọc B.8 của thiết kế và đối chiếu:

**Đối chiếu với sơ đồ RBAC** (khi có `--rbac`):

1. Các role được phép ghi trong B.8 (管理者/契約関連/搬入受付 v.v.) có khớp với hàng màn hình tương ứng trong RBAC図 không?
2. Route · API mà B.8 tham chiếu có khớp với định nghĩa trong B.0 · B.1 không?

Nếu không có RBAC図, báo ⚠️ "Chưa đối chiếu RBAC図 — chỉ xác nhận nội dung B.8".

---

#### 5.C — Kiểm tra flag các điểm chưa xác nhận [C]

> Mục đích của bước này **không phải liệt kê lại** toàn bộ `[C]` (người thiết kế đã tự ghi rồi), mà chỉ **phân loại mức độ** và báo cáo khi cần can thiệp.

Đọc section [C] của thiết kế và **chỉ báo cáo** các mục sau:

- **🔴 Nghiêm trọng**: Item `[C]` chưa xác nhận ảnh hưởng trực tiếp đến **B.1** (API sử dụng) · **B.5** (định nghĩa I/O) · **B.8** (phân quyền) → báo ❌, ghi vào bảng 🔧, khuyến nghị **hoãn phê duyệt** thiết kế
- **🟠/🟡/🟢**: Bỏ qua trong báo cáo — người thiết kế đã biết, không cần nhắc lại

---

### Bước 6 — Hiển thị kết quả review

Sau khi phân tích xong toàn bộ section, hiển thị kết quả **bằng tiếng Việt** trực tiếp cho user. Không đăng comment lên PR.

```markdown
## 🔎 Review Thiết kế chi tiết — `<design_file>`

**PR:** `<PR_URL>`
**Wireframe:** `<spec_file>` / **遷移図:** `<transition_file>` / **OpenAPI:** `<openapi_file>`
**Code-def:** `<code_def_file>` / **RBAC:** `<rbac_file>` / **Table:** `<table_file>`

---

### [A] Tổng quan

| Điểm kiểm tra        | Kết quả                 |
| -------------------- | ----------------------- |
| Mục đích màn hình    | ✅ Rõ ràng / ⚠️ Chưa rõ |
| Đối tượng người dùng | ✅ Rõ ràng / ⚠️ Chưa rõ |

---

### B.0 — Route & sessionStorage

| Điểm kiểm tra      | Thiết kế       | Kết quả  |
| ------------------ | -------------- | -------- |
| Route path         | `/shokuin/xxx` | ✅/❌/⚠️ |
| sessionStorage key | `authToken`    | ✅/❌/⚠️ |

---

### B.1 — API & Điều hướng

| Điểm kiểm tra | Thiết kế (B.1)  | OpenAPI / 遷移図 | Kết quả |
| ------------- | --------------- | ---------------- | ------- |
| API endpoint  | GET /api/v1/xxx | ✅ tồn tại       | ✅/❌   |
| 遷移元        | マイページ      | Có trong 遷移図  | ✅/❌   |
| 遷移先        | パスワード変更  | Có trong 遷移図  | ✅/❌   |

---

### B.2 — Field, enum & Điều kiện hiển thị

| Field         | Thiết kế (B.2)                     | Wireframe / Code-def / Table | Kết quả |
| ------------- | ---------------------------------- | ---------------------------- | ------- |
| user_kbn_code | 職員=1                             | code-def: 職員=2 (USR-0002)  | ❌      |
| フィールドXX  | Có trong wireframe                 | Không ghi trong B.2          | ❌      |
| fieldYY       | kiểu: string                       | table: kiểu INT              | ❌      |
| フィールドZZ  | Có điều kiện hiển thị chỉ cho 排出 | ✅                           | ✅      |

---

### B.3 — Validate & Xử lý lỗi

| Điểm kiểm tra   | Thiết kế (B.3)            | Kết quả               |
| --------------- | ------------------------- | --------------------- |
| Độ dài password | 8 ký tự trở lên (B.3.1)   | ✅ Khớp với wireframe |
| Xử lý lỗi 401   | Chuyển đến màn hình login | ✅ Nhất quán với B.6  |

---

### B.4 — Luồng xử lý

| Điểm kiểm tra                              | Kết quả |
| ------------------------------------------ | ------- |
| Nhất quán API call (B.4 ↔ B.1)             | ✅/❌   |
| Nhất quán điều kiện phân nhánh (B.4 ↔ B.2) | ✅/❌   |
| Nhất quán error flow (B.4 ↔ B.6)           | ✅/❌   |

---

### B.5 — API Input/Output

| Endpoint    | Field       | Thiết kế (B.5) | OpenAPI    | Kết quả |
| ----------- | ----------- | -------------- | ---------- | ------- |
| GET /v1/xxx | bizType     | `emitter`      | `haisyuto` | ❌      |
| GET /v1/xxx | JSON sample | Không có       | —          | ⚠️      |

---

### B.6 — Điều hướng khi lỗi

| Lỗi | Thiết kế (B.6) | 遷移図          | Kết quả |
| --- | -------------- | --------------- | ------- |
| 401 | → /login       | Có trong 遷移図 | ✅      |

---

### B.8 — RBAC

| Role     | Thiết kế (B.8) | RBAC図      | Kết quả |
| -------- | -------------- | ----------- | ------- |
| 管理者   | ✅             | ✅          | ✅      |
| 契約関連 | ✅             | ❌ Không có | ❌      |

---

### 🔧 Danh sách vấn đề cần sửa

| # | Mục | Dòng | Vấn đề | Hướng sửa |
| - | --- | ---- | ------ | --------- |
| 1 | B.1 | L.xx | API `GET /api/v1/xxx` không tồn tại trong OpenAPI | Cập nhật endpoint khớp với OAS |
| 2 | B.2 | L.xx | `user_kbn_code`: thiết kế ghi 職員=1, code-def ghi 職員=2 (USR-0002) | Sửa giá trị enum trong B.2 |
| 3 | B.8 | L.xx | Role `契約関連` không có trong RBAC図 | Xác nhận lại role với PO |

---

### 📊 Tổng kết

| Mục               | ❌ Lỗi | ⚠️ Cần xác nhận | ✅ Khớp |
| ----------------- | ------ | --------------- | ------- |
| [A] Tổng quan     | 0      | 0               | 2       |
| B.0 Route/session | 0      | 0               | 2       |
| B.1 API/遷移      | 1      | 0               | 3       |
| B.2 Field/enum    | 2      | 1               | 5       |
| B.3 Validate      | 0      | 1               | 2       |
| B.4 Flow          | 0      | 0               | 3       |
| B.5 I/O           | 1      | 1               | 4       |
| B.6 Error nav     | 0      | 0               | 2       |
| B.8 RBAC          | 1      | 0               | 2       |

---

> 🤖 Review tự động bởi `/review:design` skill
```

Mỗi section không có ❌/⚠️ thì hiển thị `✅ Không phát hiện vấn đề`.

Sau khi hiển thị kết quả, hỏi người dùng:

> Bạn có muốn lưu kết quả vào file không? (`C:\Users\hanhh\OneDrive\Desktop\TRION\Project\review\<tên màn hình>_design_review.md`)

---

## Lưu ý

- Tài liệu thiết kế được lấy từ PR branch
- Đối chiếu với mockup KHÔNG nằm trong phạm vi của skill này
- Nếu PR có nhiều file thiết kế, chia theo từng màn hình để hiển thị
- Nếu tài liệu thiết kế không có nội dung cho section nào, bỏ qua và ghi rõ "Không có nội dung"
- Hiển thị kết quả bằng tiếng Việt. Không đăng comment lên PR
