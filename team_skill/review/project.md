# Skill Review — Kiểm tra mâu thuẫn toàn bộ dự án

## Mục đích

Đối chiếu xuyên suốt toàn bộ dự án (Wireframe spec, tài liệu thiết kế, OpenAPI, mockup) và phát hiện hàng loạt mọi mâu thuẫn / sai lệch giữa tài liệu và implementation.

Trong khi các review riêng lẻ (`/review:spec`, `/review:api`, `/review:design`, `/review:mock`) chỉ đối chiếu giữa một cặp layer, skill này **xuyên suốt toàn bộ 4 layer cùng một lúc**, qua đó phát hiện các mâu thuẫn phức hợp (ví dụ: tài liệu thiết kế và mockup nhất quán với nhau nhưng cả hai đều sai lệch so với Wireframe, v.v.).

## Cú pháp gọi

```text
/review:project [--screen <screen_keyword>] [--all]
```

- `--screen`: Từ khóa màn hình đối tượng (ví dụ: `LOGIN`, `MYPAGE`, `CONTRACT`). Nếu bỏ qua thì tương đương `--all`.
- `--all`: Review toàn bộ màn hình một lần.

**Ví dụ:**

```bash
# Review toàn bộ màn hình một lần
/review:project --all

# Chỉ màn hình cụ thể
/review:project --screen LOGIN
/review:project --screen MYPAGE
/review:project --screen CONTRACT
```

---

## Cấu trúc layer

Skill này đối chiếu 4 layer sau:

| Layer | Loại | Vị trí |
|---------|------|------|
| L1: Wireframe spec | PDF | `trion-doc/docs/mockup/*.pdf` |
| L2: Tài liệu thiết kế chi tiết | Markdown | `trion-doc/docs/screens/DETAILED_DESIGN_*.md` |
| L3: Tài liệu đặc tả OpenAPI | JSON | `trion-doc/docs/public/openapi.json` |
| L4: Mockup | TSX/JSX | `trion-frontend/src/pages/**` / `src/components/**` |

Hướng đối chiếu:

```
L1 (Wireframe) ←→ L2 (Tài liệu thiết kế)   ← tương đương /review-spec
L2 (Tài liệu thiết kế)    ←→ L3 (OpenAPI)  ← tương đương /review-api
L2 (Tài liệu thiết kế)    ←→ L4 (Mockup) ← tương đương /review-design
L1 (Wireframe) ←→ L4 (Mockup) ← tương đương /review-mock
```

---

## Quy trình thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `--screen`: Từ khóa màn hình đối tượng (nếu bỏ qua thì coi như toàn bộ màn hình, tương đương `--all`)
- `--all`: Khi chỉ định rõ ràng thì cũng áp dụng cho toàn bộ màn hình

Nếu cả `--screen` và `--all` đều được chỉ định thì ưu tiên `--all`.

### Bước 2 — Xác định mapping màn hình đối tượng

Sử dụng bảng mapping màn hình dưới đây để xác định nhóm file tương ứng với mỗi màn hình:

| Từ khóa màn hình | Wireframe PDF | Tài liệu thiết kế chi tiết | Từ khóa đường dẫn mockup |
|--------------|---------------|-----------|----------------------|
| `LOGIN` | `1_login-screen.pdf` | `DETAILED_DESIGN_NO_1_2_LOGIN.md` | `Login`, `login` |
| `REGISTER` | `2_new-account-registration.pdf` | `DETAILED_DESIGN_NO_1_2_LOGIN.md` (phần đăng ký) | `Register`, `NewAccount` |
| `MYPAGE_STAFF` | `3_my-page_staff.pdf` | `DETAILED_DESIGN_NO_3_4_MYPAGE.md` | `Mypage` + `staff` |
| `MYPAGE_BUSINESS` | `4_my-page_business-operator.pdf` | `DETAILED_DESIGN_NO_3_4_MYPAGE.md` | `Mypage` + `business` |
| `ACCOUNT_STAFF` | `5_account-info-screen_staff.pdf` | `DETAILED_DESIGN_NO_5_6_ACCOUNT_INFO.md` | `AccountInfo` + `staff` |
| `ACCOUNT_BUSINESS` | `6_account-info-screen_business-operator.pdf` | `DETAILED_DESIGN_NO_5_6_ACCOUNT_INFO.md` | `AccountInfo` + `business` |
| `CONTRACT_STAFF` | `7_contract-menu_staff.pdf` | `DETAILED_DESIGN_NO_7_8_KEIYAKU.md` | `Contract` + `staff` |
| `CONTRACT_BUSINESS` | `8_contract-menu_business-operator.pdf` | `DETAILED_DESIGN_NO_7_8_KEIYAKU.md` | `Contract` + `business` |
| `DELIVERY_STAFF` | `9_delivery-menu_staff.pdf` | `DETAILED_DESIGN_NO_9_10_HANNYUU.md` | `Delivery`, `CarryinPlan` + `staff` |
| `DELIVERY_BUSINESS` | `10_delivery-menu_business-operator.pdf` | `DETAILED_DESIGN_NO_9_10_HANNYUU.md` | `Delivery` + `business` |
| `SETTLEMENT_STAFF` | `11_settlement-menu_staff.pdf` | `DETAILED_DESIGN_NO_11_12_SEISAN.md` | `Settlement` + `staff` |
| `SETTLEMENT_BUSINESS` | `12_settlement-menu_business-operator.pdf` | `DETAILED_DESIGN_NO_11_12_SEISAN.md` | `Settlement` + `business` |
| `PASSWORD` | `15_password-change-screen.pdf` | `DETAILED_DESIGN_NO_17_PASSWORD.md` | `ChangePassword`, `Password` |

Khi chỉ định `--screen`, thu hẹp nhóm theo kết quả khớp một phần từ bảng trên (ví dụ: `MYPAGE` → áp dụng cho cả `MYPAGE_STAFF` và `MYPAGE_BUSINESS`).

Khi chỉ định `--all`, áp dụng cho toàn bộ nhóm.

### Bước 3 — Kiểm tra sự tồn tại của file và đọc file

Đối với mỗi nhóm đối tượng, đọc các file sau:

**L1: Wireframe PDF**

**Về nguyên tắc, lấy PDF từ NotebookLM (đọc trực tiếp bằng công cụ Read là biện pháp cuối cùng để tiết kiệm token).**

Xác định tên màn hình đối tượng từ tên file PDF, rồi lấy thông tin cần thiết bằng một query duy nhất với lệnh sau:

```bash
cd /Users/masayakato/.claude/skills/notebooklm && python3 scripts/run.py ask_question.py \
  --question "Vui lòng cho biết tất cả các thông tin sau về <tên màn hình>: ① Danh sách mục hiển thị, trường nhập liệu, nút (bao gồm số thứ tự) ② Luồng thao tác, chuyển màn hình ③ Danh sách validation và thông báo lỗi ④ Ví dụ SQL và cột đối tượng cho xử lý cập nhật bảng (INSERT/UPDATE/DELETE)" \
  --notebook-id "産業廃棄物最終処分場-情報システム"
```

Tên màn hình được xác định theo mapping sau:
| Tên file PDF | Tên màn hình |
|---|---|
| `1_login-screen.pdf` | Màn hình đăng nhập |
| `2_new-account-registration.pdf` | Màn hình đăng ký tài khoản mới |
| `3_my-page_staff.pdf` | Trang cá nhân (Nhân viên) |
| `4_my-page_business-operator.pdf` | Trang cá nhân (Đơn vị thải bỏ) |
| `5_account-info-screen_staff.pdf` | Màn hình thông tin tài khoản (Nhân viên) |
| `6_account-info-screen_business-operator.pdf` | Màn hình thông tin tài khoản (Đơn vị thải bỏ) |
| `7_contract-menu_staff.pdf` | Menu hợp đồng (Nhân viên) |
| `8_contract-menu_business-operator.pdf` | Menu hợp đồng (Đơn vị thải bỏ) |
| `9_delivery-menu_staff.pdf` | Menu vận chuyển (Nhân viên) |
| `10_delivery-menu_business-operator.pdf` | Menu vận chuyển (Đơn vị thải bỏ) |
| `11_settlement-menu_staff.pdf` | Menu thanh toán (Nhân viên) |
| `12_settlement-menu_business-operator.pdf` | Menu thanh toán (Đơn vị thải bỏ) |
| `13_statistics-menu.pdf` | Menu thống kê |
| `14_management-menu.pdf` | Menu quản lý |
| `15_password-change-screen.pdf` | Màn hình đổi mật khẩu |
| `16_business-info-registration-screen.pdf` | Màn hình đăng ký thông tin doanh nghiệp |
| `17_new-contract-application.pdf` | Màn hình đăng ký hợp đồng mới |
| `18_contract-change-application.pdf` | Màn hình đăng ký thay đổi hợp đồng |
| `19_change-notification_waste-discharge-operator.pdf` | Thông báo thay đổi (Đơn vị thải bỏ) |
| `20_change-notification_collection-transport-operator.pdf` | Thông báo thay đổi (Đơn vị thu gom vận chuyển) |
| `21_delivery-vehicle-registration.pdf` | Màn hình đăng ký xe vận chuyển |
| `22_safety-management-training.pdf` | Màn hình đào tạo quản lý an toàn |
| `23_safety-training-video-page.pdf` | Trang video đào tạo an toàn |
| `24_safety-training-test-screen.pdf` | Màn hình kiểm tra đào tạo an toàn |
| `25_business-registration-change-list_staff.pdf` | Danh sách đơn thông tin doanh nghiệp (Nhân viên) |
| `26_new-change-contract-list_staff.pdf` | Danh sách đơn hợp đồng mới/thay đổi (Nhân viên) |
| `26_1_new-change-contract-detail_staff.pdf` | Chi tiết đơn hợp đồng mới/thay đổi (Nhân viên) |
| `27_vehicle-registration-list_staff.pdf` | Danh sách đơn đăng ký xe vận chuyển (Nhân viên) |
| `28_business-registration-change-list_business-operator.pdf` | Danh sách đơn thông tin doanh nghiệp (Đơn vị) |
| `29_new-change-contract-list_business-operator.pdf` | Danh sách đơn hợp đồng mới/thay đổi (Đơn vị) |
| `30_vehicle-registration-list_business-operator.pdf` | Danh sách đơn đăng ký xe vận chuyển (Đơn vị) |
| `delivery-reception-screen.pdf` | Màn hình tiếp nhận vận chuyển |
| `delivery-reservation-input.pdf` | Màn hình nhập đặt lịch vận chuyển |
| `delivery-reservation-confirmation-change.pdf` | Màn hình xác nhận/thay đổi đặt lịch vận chuyển |

Nếu nhận được câu trả lời từ NotebookLM thì sử dụng nội dung đó làm Wireframe spec.

**Trường hợp câu trả lời không đầy đủ:** Trước khi đọc trực tiếp PDF bằng công cụ Read, hãy xác nhận với người dùng.

> Bạn có muốn đọc trực tiếp file PDF không? (Sẽ tiêu tốn nhiều token)

Nếu file không tồn tại thì ghi lại "Chưa lấy được L1(Wireframe)" và tiếp tục.

**L2: Tài liệu thiết kế chi tiết**

```
trion-doc/docs/screens/<DETAILED_DESIGN_*.md>
```

Liệt kê file đối tượng bằng công cụ Glob rồi đọc bằng công cụ Read. Nếu không tồn tại thì ghi lại "Chưa lấy được L2(Tài liệu thiết kế)" và tiếp tục.

**L3: Tài liệu đặc tả OpenAPI**

```
trion-doc/docs/public/openapi.json
```

Đọc bằng công cụ Read (chung cho tất cả nhóm. Chỉ đọc 1 lần). Nếu có tham chiếu schema bằng `$ref` thì cũng tham chiếu thêm phần `components`.

**L4: Mockup**

Liệt kê file khớp với từ khóa từ `trion-frontend/src/pages/**` / `trion-frontend/src/components/**` bằng công cụ Glob, rồi đọc bằng công cụ Read. Nếu không tồn tại thì ghi lại "Chưa lấy được L4(Mockup)" và tiếp tục.

### Bước 4 — So sánh / phân tích giữa các layer (lặp lại cho từng nhóm)

Đối với mỗi nhóm, phát hiện mâu thuẫn theo 6 trục đối chiếu sau:

#### Trục A: L1 ↔ L2 (Wireframe ↔ Tài liệu thiết kế)

- Màn hình, section, field, action ghi trong Wireframe có được mô tả trong tài liệu thiết kế không
- Có mục nào được mô tả trong tài liệu thiết kế nhưng không tồn tại trong Wireframe không
- Luồng người dùng và luồng thao tác có nhất quán không

#### Trục B: L2 ↔ L3 (Tài liệu thiết kế ↔ OpenAPI)

- API endpoint mà tài liệu thiết kế tham chiếu có được định nghĩa trong OpenAPI không
- HTTP method, request field (tên, kiểu dữ liệu, bắt buộc/tùy chọn) có nhất quán không
- Response field, HTTP status, error code có nhất quán không
- Yêu cầu xác thực (Bearer token, v.v.) có nhất quán không
- Key lưu trong sessionStorage có nhất quán với response field của OpenAPI không

#### Trục C: L2 ↔ L4 (Tài liệu thiết kế ↔ Mockup)

- Tên màn hình và Route path ghi trong tài liệu thiết kế có nhất quán với mockup không
- Mục menu và navigation (tên mục, thứ tự, điều kiện hiển thị) có nhất quán không
- Tên field và nhãn nút có nhất quán không
- Điều kiện hiển thị và logic phân nhánh (kiểm soát hiển thị theo vai trò, kiểm soát theo trạng thái) có nhất quán không
- Tên key của sessionStorage / API call có nhất quán không

#### Trục D: L1 ↔ L4 (Wireframe ↔ Mockup)

- Field, label, nút, section ghi trong Wireframe có được implement trong mockup không
- Layout, vị trí phần tử, grouping có nhất quán không
- Chuyển màn hình, mở/đóng modal, điểm đến navigation có nhất quán không

#### Trục E: L3 ↔ L4 (OpenAPI ↔ Mockup)

- API endpoint và HTTP method mà mockup gọi có được định nghĩa trong OpenAPI không
- Request field mà mockup gửi có nhất quán với schema OpenAPI không
- Response field mà mockup tham chiếu có tồn tại trong OpenAPI không
- Cách xử lý authentication header (Bearer token, v.v.) có nhất quán không

#### Trục F: Mâu thuẫn phức hợp (sai lệch trên 3 layer trở lên)

Xuyên suốt kết quả của trục A~E, phát hiện và báo cáo riêng các pattern sau:

- **Sai lệch cô lập**: Tài liệu thiết kế và mockup nhất quán với nhau nhưng cả hai đều sai lệch so với Wireframe
- **Mâu thuẫn cascade**: Wireframe ≠ Tài liệu thiết kế → Tài liệu thiết kế = Mockup (mâu thuẫn có nguồn gốc từ Wireframe lan truyền xuống downstream)
- **Chuỗi sai lệch API**: Mô tả API trong tài liệu thiết kế sai lệch so với OpenAPI, và mockup tuân theo tài liệu thiết kế nên cũng sai lệch so với OpenAPI
- **Nhất quán một phần**: Mục nhất quán ở một số trục nhưng mâu thuẫn ở trục khác

### Bước 5 — Xem trước và xác nhận nội dung review

Sau khi hoàn thành phân tích tất cả nhóm, hiển thị cho người dùng theo format sau bằng **tiếng Nhật**:

````markdown
## 🗺️ Kết quả review xuyên suốt dự án

**Màn hình đối tượng:** <danh sách nhóm màn hình>
**Thời điểm review:** <thời gian>

---

## 📊 Tóm tắt toàn bộ

| Màn hình | L1↔L2 | L2↔L3 | L2↔L4 | L1↔L4 | L3↔L4 | Mâu thuẫn phức hợp |
|-----|-------|-------|-------|-------|-------|---------|
| LOGIN | ✅ 0 | ❌ 2 | ⚠️ 1 | ✅ 0 | ❌ 1 | 1 |
| MYPAGE_STAFF | ... | ... | ... | ... | ... | ... |

**Tổng số mâu thuẫn:** N
**Cần xử lý (❌):** N
**Cần xác nhận (⚠️):** N

---

## 🔍 Chi tiết theo màn hình

### <Tên nhóm màn hình> (ví dụ: LOGIN)

**File đối tượng:**
- L1: `trion-doc/docs/mockup/1_login-screen.pdf`
- L2: `trion-doc/docs/screens/DETAILED_DESIGN_NO_1_2_LOGIN.md`
- L3: `trion-doc/docs/public/openapi.json`
- L4: `trion-frontend/src/pages/Login/Login.tsx`

#### Trục A: Wireframe ↔ Tài liệu thiết kế

##### ❌ Mâu thuẫn / Sai lệch
| Hạng mục | Wireframe(L1) | Tài liệu thiết kế(L2) | Ghi chú |
|-----|--------------|-----------|------|

##### ⚠️ Cần xác nhận
- <nội dung cần xác nhận>

#### Trục B: Tài liệu thiết kế ↔ OpenAPI

##### ❌ Mâu thuẫn / Sai lệch
| Quan điểm | Tài liệu thiết kế(L2) | OpenAPI(L3) | Ghi chú |
|-----|-----------|------------|------|

#### Trục C: Tài liệu thiết kế ↔ Mockup

##### ❌ Mâu thuẫn / Sai lệch
| Quan điểm | Tài liệu thiết kế(L2) | Mockup(L4) | Ghi chú |
|-----|-----------|----------------|------|

#### Trục D: Wireframe ↔ Mockup

##### ❌ Mâu thuẫn / Sai lệch
| Quan điểm | Wireframe(L1) | Mockup(L4) | Ghi chú |
|-----|--------------|----------------|------|

#### Trục E: OpenAPI ↔ Mockup

##### ❌ Mâu thuẫn / Sai lệch
| Quan điểm | OpenAPI(L3) | Mockup(L4) | Ghi chú |
|-----|------------|----------------|------|

#### Trục F: Mâu thuẫn phức hợp

- <mô tả mâu thuẫn trên nhiều layer>

---

### <Nhóm màn hình tiếp theo>
(Cấu trúc section tương tự)

---

## 🚨 Danh sách ưu tiên xử lý

Liệt kê theo thứ tự ưu tiên các mục có phạm vi ảnh hưởng lớn như mâu thuẫn phức hợp, mâu thuẫn cascade:

| Mức độ ưu tiên | Màn hình | Nội dung mâu thuẫn | Layer ảnh hưởng | Hành động đề xuất |
|-------|------|-----------|------------|--------------|
| Cao | LOGIN | <nội dung> | L2/L3/L4 | <phương án xử lý> |
| Trung | MYPAGE | <nội dung> | L1/L2 | <phương án xử lý> |
````

Nếu cả ❌ lẫn ⚠️ ở một trục đều không có kết quả nào thì hiển thị 1 dòng "✅ Không có chỉ trích".

Sau khi hiển thị bản xem trước bằng tiếng Nhật, **bắt buộc phải hiển thị thông báo xác nhận sau bằng tiếng Nhật và chờ sự chấp thuận của người dùng**:

> Bạn có muốn đăng nội dung trên dưới dạng Issue hoặc PR comment không? Vui lòng chỉ định đích đăng (Issue URL / PR URL). Nếu không cần đăng thì trả lời "Không cần".

#### Trường hợp đăng

Khi người dùng chỉ định URL đích đăng, dịch **toàn bộ nội dung thành 1 comment tiếng Việt** rồi đăng:

````markdown
## 🗺️ Review toàn bộ dự án — Kiểm tra tính nhất quán

**Màn hình được review:** <danh sách nhóm màn hình>

---

## 📊 Tổng kết toàn bộ

| Màn hình | L1↔L2 | L2↔L3 | L2↔L4 | L1↔L4 | L3↔L4 | Mâu thuẫn phức hợp |
|---------|-------|-------|-------|-------|-------|-------------------|

**Tổng số mâu thuẫn:** N
**Cần xử lý (❌):** N
**Cần xác nhận (⚠️):** N

---

## 🔍 Chi tiết theo màn hình

### <Tên nhóm màn hình>

#### Trục A: Wireframe ↔ Tài liệu thiết kế

##### ❌ Mâu thuẫn / Sai lệch
| Hạng mục | Wireframe(L1) | Tài liệu(L2) | Ghi chú |
|---------|--------------|--------------|---------|

#### Trục B: Tài liệu thiết kế ↔ OpenAPI
(Cấu trúc tương tự)

#### Trục C: Tài liệu thiết kế ↔ Mockup
(Cấu trúc tương tự)

#### Trục D: Wireframe ↔ Mockup
(Cấu trúc tương tự)

#### Trục E: OpenAPI ↔ Mockup
(Cấu trúc tương tự)

#### Trục F: Mâu thuẫn phức hợp
- <mâu thuẫn phức hợp bằng tiếng Việt>

---

## 🚨 Danh sách ưu tiên xử lý

| Ưu tiên | Màn hình | Nội dung mâu thuẫn | Layer ảnh hưởng | Hành động đề xuất |
|--------|---------|-------------------|----------------|------------------|

---

> 🤖 Review toàn bộ dự án bởi `/review:project` skill
````

Trường hợp PR comment:
```bash
gh pr comment <PR_URL> --body "<nội dung comment tiếng Việt>"
```

Trường hợp Issue comment:
```bash
gh issue comment <ISSUE_URL> --body "<nội dung comment tiếng Việt>"
```

Nếu người dùng từ chối hoặc yêu cầu chỉnh sửa, hãy chỉnh sửa **bản xem trước tiếng Nhật** theo hướng dẫn rồi xác nhận lại.

---

## Ngoài phạm vi kiểm tra

- Style và format code
- Chi tiết implementation của API (logic phía server)
- Sự khác biệt về từ ngữ trong comment và description của tài liệu đặc tả OpenAPI
- Nội dung giá trị mẫu (example)
- Chi tiết màu sắc và layout về mặt thiết kế (trường hợp không được ghi rõ trong Wireframe)
- Dữ liệu mẫu và dummy text đặc thù của mockup
- Hành vi responsive
- Văn phong và giọng điệu

---

## Lưu ý

- Đọc tài liệu đặc tả OpenAPI và tài liệu thiết kế chi tiết từ local bằng công cụ Read
- Về nguyên tắc lấy Wireframe PDF từ NotebookLM, chỉ đọc bằng công cụ Read sau khi xác nhận với người dùng khi không đầy đủ
- Đọc mockup từ local bằng công cụ Read (trường hợp không chỉ định PR branch)
- Vì tài liệu đặc tả OpenAPI chung cho tất cả nhóm nên chỉ đọc 1 lần, tái sử dụng nội dung đã đọc cho các lần sau
- Khi chỉ định `--all`, tổng hợp kết quả của tất cả nhóm vào **1 comment** rồi đăng
- Nếu có tham chiếu schema bằng `$ref` thì cũng tham chiếu thêm phần `components` để xác nhận định nghĩa field thực tế
- Layer không tìm thấy file thì ghi lại là "Chưa lấy được" và bỏ qua trục đối chiếu (A~E) chứa layer đó rồi tiếp tục
- Mâu thuẫn phức hợp (trục F) được phân tích sau khi xác nhận toàn bộ kết quả của trục A~E
- Comment được ghi bằng **tiếng Việt**
