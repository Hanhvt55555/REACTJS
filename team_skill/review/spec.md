# Skill Review — Kiểm tra tài liệu thiết kế

## Mục đích

Đối chiếu tài liệu thiết kế Markdown có trong PR của repository `trion-docs` với Wireframe spec (PDF), xác nhận xem các mục màn hình, thao tác và luồng xử lý chính đã được mô tả hay chưa. Đồng thời, sử dụng các tài liệu dự án trong thư mục `.claude/資料/` (định nghĩa schema, định nghĩa code, sơ đồ điều hướng màn hình, sơ đồ RBAC, tài liệu thiết kế cơ bản, luồng nghiệp vụ, v.v.) làm nguồn thông tin gốc để kiểm tra tính nhất quán của các giá trị code, bảng, cột, điều hướng màn hình, quyền hạn, quy tắc nghiệp vụ mà tài liệu thiết kế trích dẫn.

## Cú pháp gọi

```text
/review:spec <PR_URL> [--spec <spec_file>] [--files <file1> ...]
```

- `PR_URL`: URL PR trên GitHub (ví dụ: `https://github.com/org/trion-docs/pull/12`)
- `--spec`: Đường dẫn local của Wireframe spec PDF (nếu bỏ qua sẽ tự động chọn từ các file thay đổi trong PR)
- `--files`: Đường dẫn file Markdown cần review (nếu bỏ qua sẽ tự động lấy từ các file thay đổi trong PR)

**Ví dụ:**

```bash
# Hoàn toàn tự động (phát hiện file thay đổi trong PR và tự động chọn PDF)
/review:spec https://github.com/org/trion-docs/pull/12

# Chỉ định PDF rõ ràng
/review:spec https://github.com/org/trion-docs/pull/12 \
  --spec "trion-doc/docs/public/requirements/マイページ（職員）.pdf"

# Chỉ định cả file và PDF
/review:spec https://github.com/org/trion-docs/pull/12 \
  --spec "trion-doc/docs/public/requirements/マイページ（職員）.pdf" \
  --files trion-doc/docs/screens/DETAILED_DESIGN_NO_3_4_MYPAGE.md
```

---

## Quy trình thực hiện

### Bước 1 — Phân tích tham số

Trích xuất các thông tin sau từ ARGUMENTS:

- `PR_URL`: URL đầy đủ của PR
- `--spec`: Đường dẫn local của Wireframe spec PDF (tùy chọn)
- `--files`: Đường dẫn file Markdown cần review (tùy chọn)

Nếu thiếu `PR_URL`, hiển thị thông báo lỗi và cú pháp đúng rồi dừng xử lý.

### Bước 2 — Lấy thông tin PR và kiểm tra comment cũ (thực thi song song)

**Thực thi đồng thời 2 lệnh sau (song song):**

```bash
# [A] Lấy thông tin PR
gh pr view <PR_URL> --json number,title,headRefName,headRepository,files

# [B] Lấy comment review cũ (chỉ trích xuất dòng ❌/⚠️ để tiết kiệm token)
gh api repos/<owner/repo>/issues/<PR番号>/comments \
  --jq '[.[] | select(.body | contains("review-spec") or contains("Review Spec"))
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

※ Số PR được trích xuất trực tiếp từ PR_URL (ví dụ: `.../pull/41` → `41`). Có thể thực thi [B] mà không cần chờ [A] hoàn thành.

Trích xuất từ [A]:
- `headRefName`: Tên branch của PR
- `headRepository.nameWithOwner`: `owner/repo`
- `files[].path` và `files[].changeType`: Danh sách file thay đổi trong PR và loại thay đổi

### Bước 2.5 — Kiểm tra comment review cũ

Sử dụng kết quả từ [B] ở trên.

Nếu tồn tại comment review cũ (do skill `/review:spec`):

1. Trích xuất và xác nhận các dòng vấn đề được phát hiện (❌・⚠️) từ comment review mới nhất
2. Đối chiếu với nội dung file trên branch hiện tại, xác định từng vấn đề đã được sửa hay chưa
3. Thêm section sau **lên đầu** phần preview ở bước 8:

```markdown
### 📝 Xác nhận sửa đổi vấn đề lần trước

| Nội dung vấn đề | Trạng thái |
|---|---|
| <Tóm tắt nội dung vấn đề> | ✅ Đã sửa / ❌ Chưa sửa |
```

4. **Các file đã được review trước đó sẽ không review lại.** Từ bước 3~7 trở đi, chỉ xử lý các file được thêm mới hoặc thay đổi vào PR sau comment review lần trước. Bỏ qua các file đã được review trong comment cũ.

Nếu không có comment review cũ, bỏ qua bước này và review toàn bộ file theo quy trình thông thường.

### Bước 3 — Xác định file cần review

Nếu `--files` được chỉ định, sử dụng danh sách đó.

Nếu bỏ qua, tự động trích xuất các file `.md` nằm trong `docs/screens/` hoặc `docs/` từ các file thay đổi trong PR. **Loại bỏ các file đã được xác định là đã review ở bước 2.5.**

```bash
gh pr view <PR_URL> --json files --jq '.files[].path' | grep -E '\.md$' | grep -E 'docs/'
```

Nếu số file cần xử lý là 0, hiển thị "Không tìm thấy file Markdown cần review" rồi dừng xử lý.

### Bước 4 — Tự động chọn PDF tương ứng

Nếu `--spec` được chỉ định, sử dụng giá trị đó.

Nếu bỏ qua, tự động chọn PDF tương ứng từ đường dẫn (tên file, tên thư mục) của file cần review theo bảng mapping sau:

| Từ khóa trong file tài liệu thiết kế | PDF tương ứng |
|------------------------|---------|
| `NO_1_2_LOGIN`, `LOGIN`, `login` | Cả `ログイン画面（職員）.pdf` và `ログイン画面（事業者）.pdf` |
| `NO_3_4_MYPAGE`, `MYPAGE`, `mypage` (không phân biệt được) | Cả `マイページ（職員）.pdf` và `マイページ（事業者）.pdf` |
| `MYPAGE` + `staff`/`SHOKUIN` | `マイページ（職員）.pdf` |
| `MYPAGE` + `business`/`JIGYOSHA` | `マイページ（事業者）.pdf` |
| `NO_5_ACCOUNT_INFO_MENU`, `ACCOUNT_INFO_MENU` | `アカウント情報メニュー.pdf` |
| `NO_15_ACCOUNT_INFO_CONFIRM_SHOKUIN` | `アカウント情報確認（職員）.pdf` |
| `NO_16_ACCOUNT_INFO_CONFIRM_JIGYOSHA` | `アカウント情報確認（事業者）.pdf` |
| `NO_7_JIGYOUSHA_JOUHOU_MENU_STAFF` | `事業者情報メニュー（職員）.pdf` |
| `NO_6_JIGYOUSHA_JOUHOU_MENU_BUSINESS` | `事業者情報メニュー（事業者）.pdf` |
| `NO_22_JIGYOUSHA_JOUHOU_TOROKU` | `事業者情報登録.pdf` |
| `NO_28_29_JIGYOUSHA_SHINSEI_LIST_STAFF`, `NO_42_43_JIGYOUSHA_SHINSEI_LIST_BUSINESS` | `事業者情報申請一覧.pdf` |
| `JIGYOUSHA_SHINSEI_HENKOU` | `事業者情報申請変更.pdf` |
| `NO_7_8_KEIYAKU_MENU` + `staff` | `契約メニュー（職員）.pdf` |
| `NO_7_8_KEIYAKU_MENU` + `business` | `契約メニュー（事業者）.pdf` |
| `NO_7_8_KEIYAKU_MENU` (không phân biệt được) | Cả `契約メニュー（職員）.pdf` và `契約メニュー（事業者）.pdf` |
| `KEIYAKU_LIST` + `staff` | `契約一覧（職員）.pdf` |
| `KEIYAKU_LIST` + `business` | `契約一覧（事業者）.pdf` |
| `NO_30_KEIYAKU_MOUSHIKOMI_LIST_STAFF` | `契約申込一覧（職員）.pdf` |
| `NO_95_46_KEIYAKU_MOUSHIKOMI_LIST_BUSINESS` | `契約申込一覧（事業者）.pdf` |
| `NO_36_KEIYAKU_MOUSHIKOMI_DETAIL_STAFF` + `new`/`shinki` | `契約申込変更（新規）.pdf` |
| `NO_36_KEIYAKU_MOUSHIKOMI_DETAIL_STAFF` + `change`/`henkou` | `契約申込変更（変更）.pdf` |
| `NO_23_SHINKI_KEIYAKU_MOUSHIKOMI` | `新規契約申込.pdf` |
| `NO_24_HENKOU_KEIYAKU_MOUSHIKOMI` | `変更契約申込.pdf` |
| `NO_25_HENKOU_TODOKEDESHO_HAISHUTSU` | `変更届（排出事業者）.pdf` |
| `NO_26_HENKOU_TODOKEDESHO_SHUUSHUU` | `変更届（収集運搬業者）.pdf` |
| `NO_9_10_HANNYUU_MENU` + `staff` | `搬入メニュー（職員）.pdf` |
| `NO_9_10_HANNYUU_MENU` + `business` | `搬入メニュー（事業者）.pdf` |
| `NO_9_10_HANNYUU_MENU` (không phân biệt được) | Cả `搬入メニュー（職員）.pdf` và `搬入メニュー（事業者）.pdf` |
| `NO_44_45_HANNYUU_SCHEDULE` + `staff` | `搬入予定表（職員）.pdf` |
| `NO_44_45_HANNYUU_SCHEDULE` + `business` | `搬入予定表（事業者）.pdf` |
| `NO_44_45_HANNYUU_SCHEDULE` (không phân biệt được) | Cả `搬入予定表（職員）.pdf` và `搬入予定表（事業者）.pdf` |
| `HANNYUU_KANOU`, `hannyuu-kanou` | `搬入予定表の搬入可能日時.pdf` |
| `NO_46_HANNYUU_RESERVATION_INPUT` | `搬入予約入力.pdf` |
| `NO_47_HANNYUU_RESERVATION_CONFIRM` | `搬入予約確認.pdf` |
| `HANNYUU_UKETSUKE`, `hannyuu-uketsuke` | `搬入受付.pdf` |
| `HANNYUU_JISSEKI` + `staff` | `搬入実績一覧（職員）.pdf` |
| `HANNYUU_JISSEKI` + `business` | `搬入実績一覧（事業者）.pdf` |
| `NO_28_HANNYUU_SHARYOU_TOUROKU_MOUSHIKOMI` | `搬入車両登録申請.pdf` |
| `YOYAKU_KIGEN`, `yoyaku-kigen` | `予約入力・変更期限.pdf` |
| `NO_11_12_SEISAN_MENU` + `staff` | `精算メニュー（職員）.pdf` |
| `NO_11_12_SEISAN_MENU` + `business` | `精算メニュー（事業者）.pdf` |
| `NO_11_12_SEISAN_MENU` (không phân biệt được) | Cả `精算メニュー（職員）.pdf` và `精算メニュー（事業者）.pdf` |
| `NO_17_CHANGE_PASSWORD`, `PASSWORD`, `password` | `パスワード変更.pdf` |
| `NO_21_SHINKI_TOROKU_SHINSEI` | `新規登録申請.pdf` |
| `NO_14_TOUKEI_MENU` | `統計メニュー.pdf` |
| `NO_15_KANRI_MENU` | `管理メニュー.pdf` |
| `SHOKUIN_ACCOUNT_LIST` | `職員アカウント一覧.pdf` |
| `ANZEN_KANRI_MENU`, `SAFETY_TRAINING_MENU` | `安全管理講習メニュー.pdf` |
| `ANZEN_KANRI_VIDEO` | `安全管理講習の動画ページ.pdf` |
| `ANZEN_KANRI_TEST` | `安全管理講習の確認テスト.pdf` |
| `NO_94_49_SHARYOU_TOROKU_SHINSEI_LIST_BUSINESS` | `車両登録申請一覧.pdf` |
| `SHARYOU_TOROKU_SHINSEI_HENKOU` | `車両登録申請変更.pdf` |
| `TOUROKU_SHARYOU_LIST` | `登録車両一覧.pdf` |
| `TOUROKU_SHARYOU_HENKOU` | `登録車両変更申請.pdf` |
| `HAISHUTSU_JIGYOUSHA_LIST` | `排出事業者一覧.pdf` |
| `HAISHUTSU_JIGYOUSHA_SHINSEI_LIST` | `排出事業者申請一覧.pdf` |
| `HAISHUTSU_JIGYOUSHA_SHARYOU_LIST` | `排出事業者登録車両一覧.pdf` |
| `HAISHUTSU_JIGYOUSHA_SHARYOU_SHINSEI_LIST` | `排出事業者車両登録申請一覧.pdf` |
| `SHUUSHUU_UNPAN_LIST` | `収集運搬業者一覧.pdf` |
| `SHUUSHUU_UNPAN_SHINSEI_LIST` | `収集運搬業者申請一覧.pdf` |
| `SHUUSHUU_UNPAN_SHARYOU_LIST` | `収集運搬業者登録車両一覧.pdf` |
| `SHUUSHUU_UNPAN_SHARYOU_SHINSEI_LIST` | `収集運搬業者車両登録申請一覧.pdf` |
| `HAIKIBUTSU_HINMOKU_LIST` | `廃棄物品目一覧.pdf` |
| `HAIKIBUTSU_HINMOKU_TOUROKU` | `廃棄物品目登録.pdf` |
| `HAIKIBUTSU_HINMOKU_DETAIL` | `廃棄物品目詳細.pdf` |
| `NIPPOU`, `daily-report` | `日報出力.pdf` |
| `GEPPOU`, `monthly-report` | `月報出力.pdf` |
| `NENPOU`, `annual-report` | `年報出力.pdf` |
| `HOUKOKUSHO_SHIDOU` | `報告書・指導記録一覧.pdf` |
| `GENCHI_KAKUNIN` | `現地確認結果一覧.pdf` |
| `KAN_I_YOUSHUTSU` | `簡易溶出試験結果登録.pdf` |
| `KEIKOU_XSEN` | `蛍光X線検査結果登録.pdf` |

Đường dẫn PDF là `trion-doc/docs/public/requirements/<filename>`.

Khi nhiều file tương ứng với các màn hình khác nhau, hãy nhóm PDF và file theo từng màn hình rồi review riêng lẻ.

Nếu không xác định được PDF tương ứng, hiển thị "Không xác định được Wireframe PDF tương ứng. Vui lòng chỉ định bằng `--spec`" rồi dừng xử lý.

### Bước 5 — Đọc Wireframe spec

Đọc trực tiếp PDF đã xác định ở bước 4 từ `trion-doc/docs/public/requirements/<filename>` bằng công cụ Read.

```text
Read tool → trion-doc/docs/public/requirements/<PDFファイル名>
```

Đọc toàn bộ trang của PDF (nếu PDF dung lượng lớn, hãy chia phạm vi trang bằng tham số `pages`).

Trích xuất các thông tin sau từ PDF để sử dụng làm Wireframe spec:

1. Danh sách các mục hiển thị, trường nhập liệu, nút (bao gồm số thứ tự mục)
2. Luồng thao tác, điều hướng màn hình
3. Danh sách validation và thông báo lỗi
4. Bảng, cột, ví dụ SQL mục tiêu của xử lý cập nhật bảng (INSERT/UPDATE/DELETE)

Nếu PDF không tồn tại, ghi lại "Không tìm thấy Wireframe PDF ở local" rồi dừng xử lý.

### Bước 5.5 — Tham chiếu tài liệu tham khảo phụ (thư mục tài liệu)

Ngoài Wireframe (bước 5), sử dụng các tài liệu dự án trong `.claude/資料/` để **kiểm tra xác nhận tính nhất quán**. Xác nhận tính nhất quán của các giá trị (code, bảng, cột, điều hướng màn hình, quyền hạn, API) mà tài liệu thiết kế trích dẫn bằng các nguồn thông tin gốc này.

**Đường dẫn gốc tài liệu:** `.claude/資料/`
※ Tên file có kèm ngày phiên bản (ví dụ `v6_0601`), nên **luôn dùng glob để chọn phiên bản mới nhất**.
※ Tên file trên macOS được lưu theo NFD (tách dấu thanh), nên các tên có chứa katakana (ví dụ `ド` trong `コード`) dễ không khớp với pattern NFC. Glob nên dùng **pattern tiền tố số tài liệu như `資料NN_*`** để tránh katakana có dấu thanh.

**Các tài liệu chính và mục đích sử dụng (theo thứ tự ưu tiên. Chỉ tham chiếu tài liệu thực sự tồn tại):**

| Phân loại | Tài liệu | File (glob) | Định dạng | Mục đích (quan điểm đối chiếu) |
|------|------|------------------|------|------------------|
| 🟢Bắt buộc | Định nghĩa schema (Tài liệu 14) | `.claude/資料/資料14_*.xlsx` | xlsx | Xác nhận sự tồn tại của **tên bảng, tên cột, kiểu dữ liệu, ràng buộc NOT NULL/UNIQUE, phạm vi giá trị code** (kiểm tra xác nhận mục tiêu INSERT/UPDATE/DELETE) |
| 🟢Bắt buộc | Định nghĩa code (Tài liệu 15) | `.claude/資料/資料15_*.xlsx` | xlsx | Tính đúng đắn của **giá trị code và tên** của phân loại, trạng thái, enum (phân loại người dùng, quyền hạn, loại đơn đăng ký, trạng thái phê duyệt, mã kết quả, v.v.) |
| 🟡Có điều kiện | Sơ đồ RBAC | `.claude/資料/RBAC*.xlsx` (sheet phiên bản hoàn chỉnh) | xlsx | Tính nhất quán của **role được phép đối với từng màn hình/API** (4 quyền hạn nhân viên, đơn vị kinh doanh, system_maintenance) |
| 🟡Có điều kiện | Sơ đồ điều hướng màn hình (Tài liệu 8) | `.claude/資料/資料8_*.pdf` | pdf | Tính nhất quán của **nguồn chuyển màn hình và đích chuyển màn hình** (xác minh `(要確認 EXPORT-1)`). ※ Chuỗi Route (URL) không có trong sơ đồ điều hướng, cần xác nhận riêng |
| 🟡Có điều kiện | Tài liệu thiết kế cơ bản (Tài liệu 12) | `.claude/資料/*基本設計書*.docx` | docx | Yêu cầu cấp trên. Kiểm tra xác nhận danh sách code, quy tắc nghiệp vụ mà tài liệu thiết kế trích dẫn là "Tài liệu thiết kế cơ bản P-xx Bảng x-xx" (giải quyết các `(要確認)` về ENUM v.v.) |
| 🟡Có điều kiện | Luồng nghiệp vụ | `.claude/資料/資料_業務フロー*.pptx` | pptx | Tính nhất quán của luồng nghiệp vụ (`BR-x.x`) (kiểm tra xác nhận luồng xử lý như cấp tài khoản sau phê duyệt, đăng nhập lần đầu, v.v.) |
| 🟠Tùy chọn | Danh sách chức năng (Tài liệu 7-1) | `.claude/資料/資料7-1_*.xlsx` | xlsx | Mức độ chi tiết chức năng, tổng quan (khi xác nhận màn hình mới) |
| 🟠Tùy chọn | Danh sách biểu mẫu (Tài liệu 7-2) | `.claude/資料/資料7-2_*.xlsx` | xlsx | Dành riêng cho màn hình biểu mẫu (nhật báo/nguyệt báo/niên báo) |
| 🟠Tùy chọn | Tiêu chuẩn thiết kế UI | `.claude/資料/TRION開発標準_UI*.xlsx` | xlsx | Component UI chung, quy ước UI như nút clear, v.v. (khi cần thiết) |

**Không tham chiếu (ngoài phạm vi):** `画面UI_ワイヤーフレームイメージ*.xlsx` (= wireframe gốc, sử dụng PDF ở bước 5) / `情報システム関連図*.pdf`・`資料5_*.pptx`・`資料6_*.pptx`・`資料11_*.docx` (kiến trúc/hạ tầng) / `ワイヤーフレーム進捗*.xlsx` (metadata quản lý tiến độ).
※ **Tính nhất quán của API liên kết/endpoint thuộc lĩnh vực của `/review:api`**, skill này không xử lý.
※ Ngay cả các tài liệu liệt kê trong bảng, nếu **không thực sự tồn tại trong thư mục thì không thể tham chiếu**. Nếu glob không cho kết quả, xử lý là "tài liệu chưa xác nhận" và không dừng review.

**Cách đọc theo định dạng (trạng thái cài đặt: openpyxl / python-pptx / LibreOffice(soffice) đã cài đặt, python-docx chưa triển khai):**

- **pdf** (sơ đồ điều hướng màn hình Tài liệu 8): Đọc trực tiếp bằng công cụ Read (toàn bộ trang, khi dung lượng lớn chia trang bằng `pages`).
- **xlsx** (định nghĩa schema, định nghĩa code, sơ đồ RBAC, danh sách chức năng, danh sách biểu mẫu, tiêu chuẩn UI): Trích xuất văn bản **chỉ từ sheet/hàng cần thiết** bằng `python3 + openpyxl`.
- **docx** (tài liệu thiết kế cơ bản Tài liệu 12): Vì python-docx chưa được cài đặt, trích xuất văn bản bằng thư viện chuẩn `python3` (`zipfile` + `word/document.xml`) rồi grep phần liên quan (ví dụ `表2-13`).
- **pptx** (luồng nghiệp vụ): Trích xuất văn bản shape từ mỗi slide bằng `python3 + python-pptx`. Khi cần xác nhận trực quan sơ đồ luồng, chuyển đổi sang PDF bằng `soffice --headless --convert-to pdf` rồi đọc.
- Chung: Đối với file có ngày phiên bản, **chọn phiên bản mới nhất bằng glob**, và để tiết kiệm token **chỉ trích xuất phần liên quan đến đối tượng review**.

```bash
# xlsx: Trích xuất giá trị cell của sheet cần thiết (phiên bản mới nhất qua glob, tên sheet điều chỉnh theo đối tượng)
python3 - <<'PY'
import glob, openpyxl
path = sorted(glob.glob(".claude/資料/資料14_*.xlsx"))[-1]
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
print("sheets:", wb.sheetnames)
ws = wb["対象シート名"]   # Chỉ sheet liên quan
for row in ws.iter_rows(values_only=True):
    cells = [str(c) for c in row if c is not None]
    if cells: print(" | ".join(cells))
PY

# docx: Trích xuất văn bản từ tài liệu thiết kế cơ bản rồi grep phần liên quan (chỉ dùng stdlib)
python3 - <<'PY'
import glob, zipfile, re
p = sorted(glob.glob(".claude/資料/*基本設計書*.docx"))[-1]
xml = zipfile.ZipFile(p).read("word/document.xml").decode("utf-8","ignore")
lines = [l.strip() for l in re.sub(r"<[^>]+>","",re.sub(r"</w:p>","\n",xml)).split("\n") if l.strip()]
for i,l in enumerate(lines):
    if "表2-13" in l or "雇用区分" in l or "役職区分" in l:   # Thay đổi theo từ khóa cần tìm
        print(i, l[:100])
PY

# pptx: Trích xuất văn bản từ mỗi slide của luồng nghiệp vụ
python3 - <<'PY'
import glob
from pptx import Presentation
prs = Presentation(sorted(glob.glob(".claude/資料/資料_業務フロー*.pptx"))[-1])
for si, slide in enumerate(prs.slides, 1):
    txt = [sh.text_frame.text.strip().replace("\n"," ") for sh in slide.shapes if sh.has_text_frame and sh.text_frame.text.strip()]
    if txt: print(f"slide{si}:", " / ".join(txt)[:200])
PY
```

**Chính sách tiết kiệm token và vận hành (quan trọng):**

- **Tham chiếu trì hoãn**: Chỉ mở tài liệu tham khảo phụ một cách có mục tiêu khi "tài liệu thiết kế trích dẫn và giá trị không thể xác định đúng/sai chỉ bằng Wireframe". Không đọc tất cả tài liệu và tất cả sheet ngay từ đầu.
- **Trích xuất 1 lần rồi cache và tái sử dụng**: Lưu kết quả trích xuất vào `/tmp` (ví dụ `/tmp/ref_codes.txt`・`/tmp/ref_schema.txt`) và **chia sẻ cho review nhiều màn hình**. Không trích xuất lại cùng một tài liệu cho từng màn hình. Wireframe PDF và tài liệu thiết kế cũng chỉ đọc 1 lần cho mỗi file.
- **Trích xuất giới hạn đối tượng**: xlsx chỉ lấy sheet/hàng cần thiết (**cấm dump toàn bộ sheet**), docx/pptx chỉ lấy phần liên quan qua grep từ khóa. Giới hạn ở mức tối thiểu cần thiết cho vấn đề được phát hiện (tên cột, phạm vi giá trị code, luồng liên quan, v.v.).
- **Ưu tiên diff**: Đối với file MODIFIED, chỉ lấy patch (bước 6).
- **Không xuất ✅**: Bỏ qua các section và màn hình không có vấn đề được phát hiện (bước 8).
- **Mặc định là single pass**: Subagent/song song quy mô lớn (workflow) chỉ khi **người dùng yêu cầu rõ ràng**. Mặc định review theo 1 pass (song song làm token tăng đột biến do đọc trùng lặp tài liệu và PDF).
- Nếu không tìm thấy tài liệu hoặc không xác định được sheet liên quan, xử lý là "tài liệu chưa xác nhận" và không dừng review.

### Bước 6 — Lấy file từ branch PR

Đối với mỗi file Markdown cần review, chuyển đổi cách lấy tùy theo loại thay đổi trong PR (`changeType`):

**Trường hợp ADDED (thêm mới) — Lấy toàn bộ nội dung:**
```bash
gh api "repos/<owner/repo>/contents/<file_path>?ref=<branch>" --jq '.content' | base64 -d
```

**Trường hợp MODIFIED (sửa đổi hiện có) — Chỉ lấy diff (tiết kiệm token):**
```bash
gh api repos/<owner/repo>/pulls/<PR番号>/files \
  --jq '.[] | select(.filename=="<file_path>") | .patch'
```

Khi chỉ có diff, giới hạn review ở phần thay đổi, coi các phần không thay đổi là đã được review trong lần trước.

Nếu file không tồn tại trên branch, ghi lại "Không tìm thấy trong PR" và tiếp tục xử lý các file khác.

### Bước 7 — So sánh và phân tích

Đối với mỗi file Markdown đã lấy, đối chiếu với Wireframe spec theo các quan điểm sau.

**Quan điểm review:**

1. Các màn hình và section ghi trong Wireframe có được mô tả trong tài liệu thiết kế không
2. Các trường, component, action quan trọng có được ghi lại tài liệu không
3. Có mục nào được ghi trong Wireframe nhưng không có trong tài liệu không
4. Luồng người dùng và trình tự thao tác có được ghi rõ không
5. Có sử dụng biểu đạt mơ hồ như "v.v.", "...", "các loại khác" không (chỉ rõ section và mục trong MD nơi sử dụng biểu đạt đó)
6. Các thông báo hiển thị trên màn hình (lỗi, xác nhận, thành công, v.v.) có được gán message ID không
7. Đối với xử lý cập nhật bảng (INSERT/UPDATE/DELETE), có đủ mô tả cụ thể về bảng mục tiêu, cột, điều kiện, ví dụ SQL không

**Quan điểm đối chiếu với tài liệu tham khảo phụ (thư mục tài liệu — bước 5.5):**

8. Giá trị code (phân loại, trạng thái, enum) trong tài liệu thiết kế có khớp với **định nghĩa code (Tài liệu 15)** không
9. **Tên bảng, tên cột, kiểu dữ liệu, ràng buộc, phạm vi giá trị code** mục tiêu INSERT/UPDATE/DELETE có khớp với **định nghĩa schema (Tài liệu 14)** không (có cột không tồn tại, tên sai, sai phạm vi giá trị không)
10. Điều hướng màn hình (nguồn chuyển màn hình, đích chuyển màn hình) có nhất quán với **sơ đồ điều hướng màn hình (Tài liệu 8)** không (※ Chuỗi Route không có trong sơ đồ điều hướng, cần xác nhận riêng)
11. Role được phép đối với màn hình/API có khớp với **sơ đồ RBAC (phiên bản hoàn chỉnh)** không
12. Yêu cầu cấp trên (danh sách code, quy tắc nghiệp vụ, luồng xử lý) mà tài liệu thiết kế trích dẫn có nhất quán với **tài liệu thiết kế cơ bản (Tài liệu 12)/luồng nghiệp vụ** không (đặc biệt là kiểm tra xác nhận giải quyết `(要確認)` trong tài liệu thiết kế. Khi cần thiết)

> Các vấn đề được phát hiện qua đối chiếu với tài liệu tham khảo phụ phải ghi rõ tài liệu căn cứ (ví dụ: "Không khớp với định nghĩa code Tài liệu 15", "Cột này không tồn tại trong định nghĩa schema (Tài liệu 14)").
> - Khi giá trị trong tài liệu thiết kế **mâu thuẫn** với tài liệu tham khảo phụ → ❌ Thiếu/Mâu thuẫn
> - Khi **không thể kiểm tra xác nhận bằng tài liệu tham khảo phụ / tài liệu chưa được xác định** → ⚠️ Cần bổ sung (ghi rõ "tài liệu chưa xác nhận")

**Ngoài phạm vi review:**

- Văn phong, ngữ điệu
- Thứ tự section trong tài liệu
- Chi tiết kỹ thuật triển khai

### Bước 8 — Preview nội dung review và xác nhận

Trước tiên, hiển thị kết quả review cho người dùng theo định dạng sau bằng **tiếng Nhật** (bỏ qua các section ✅ đã ghi đầy đủ để tiết kiệm token):

````markdown
## 📋 設計書レビュー — <画面名>

**参照Spec:** `<specファイルのパス>`
**レビュー対象ファイル:** `<ファイル一覧>`

凡例: ❌=不足・矛盾 / ⚠️=要補足

---

### `<file1>`

| 項目（詳細設計の該当箇所） | 詳細設計 | 資料・Wireframe | 判定 | 対応 |
|---|---|---|---|---|
| <**該当セクション**: `B.x.x`／`項番N`／確認事項`C番号` ＋ 項目名> | <設計書の記述（簡潔に）> | <資料/Wireframeの記述（**資料名を明記**: 資料14/15/8/RBAC/資料12/業務フロー/wireframe項番）> | ❌ または ⚠️ | <必要な対応（簡潔に）> |
````

**Quy tắc bắt buộc khi lập bảng:**
- **Cột "Mục" phải ghi rõ section tài liệu thiết kế chi tiết của điểm cần chỉ ra** (`B.x.x`／`項番N`／xác nhận `C番号`). Đảm bảo có thể nhìn thấy ngay vấn đề đang chỉ đến đâu trong tài liệu thiết kế, tránh tình trạng "không rõ đang nói về phần nào".
- **1 vấn đề = 1 dòng**. Luôn đối chiếu cột "Tài liệu thiết kế chi tiết" và cột "Tài liệu・Wireframe", đảm bảo có thể nhìn thấy ngay điều gì đang khác nhau / bị thiếu.
- Cột "Tài liệu・Wireframe" **phải ghi rõ nguồn căn cứ** (ví dụ: Tài liệu 15 USR, Tài liệu 14 mã kết quả, wireframe mục số 19, business flow s8).
- Khi tài liệu thiết kế **được kiểm tra xác nhận là đúng bằng tài liệu tham khảo**, vẫn giữ lại 1 dòng với phán định ⚠️ + xử lý "Ghi rõ sai lệch và căn cứ trong bảng đối chiếu" (ví dụ sai lệch với wireframe phiên bản cũ).
- **Chỉ khi không có ❌・⚠️** trong file, thay bảng bằng 1 dòng "✅ Không có vấn đề".
- Các vấn đề chung cho nhiều màn hình có thể được liệt kê lại trong bảng của từng file (thêm "(横断)" vào đầu dòng).

Sau khi hiển thị preview bằng tiếng Nhật, **bắt buộc phải hỏi xác nhận người dùng bằng tiếng Nhật và chờ phê duyệt**:

> 上記の内容を PR にコメントとして投稿してよいですか？

Khi người dùng phê duyệt, dịch sang **tiếng Việt** rồi đăng theo định dạng sau:

````markdown
## 📋 Review Spec — <画面名>

**Spec tham chiếu:** `<specファイルのパス>`
**File được review:** `<ファイル一覧>`

Chú thích: ❌=Thiếu/Mâu thuẫn / ⚠️=Cần bổ sung

---

### `<file1>`

| Mục (vị trí trong thiết kế chi tiết) | Thiết kế chi tiết | Tài liệu・Wireframe | Phân loại | Cần xử lý |
|---|---|---|---|---|
| <**Vị trí**: `B.x.x`／`項番N`／`C番号` ＋ tên mục> | <設計書の記述をベトナム語で> | <資料/Wireframeの記述をベトナム語で（**tên tài liệu を明記**: Tài liệu14/15/8/RBAC/Tài liệu12/Business flow/wireframe mục số）> | ❌ hoặc ⚠️ | <必要な対応をベトナム語で> |

---

> 🤖 Review tự động bởi `/review:spec` skill
````

> Khi đăng cũng giữ nguyên **cấu trúc cột và số dòng** như bản preview tiếng Nhật, chỉ dịch nội dung sang tiếng Việt (không tăng giảm dòng, không tóm tắt).

```bash
gh pr comment <PR_URL> --body "<ベトナム語コメント内容>"
```

Khi người dùng từ chối hoặc yêu cầu sửa đổi, hãy sửa **preview tiếng Nhật** theo hướng dẫn rồi xác nhận lại.

---

## Lưu ý

- Khi bỏ qua `--files`, tự động trích xuất file `.md` từ các file thay đổi trong PR
- Khi bỏ qua `--spec`, tự động chọn PDF tương ứng từ từ khóa trong đường dẫn file
- PDF (`--spec`) luôn được đọc bằng công cụ Read từ local tại `trion-doc/docs/public/requirements/`
- File Markdown cần review được lấy từ **branch của PR** (có thể khác với local)
- Khi review nhiều file, gộp thành **1 comment duy nhất** và chia thành các section theo từng file
- Comment được viết bằng **tiếng Việt**
- **Tài liệu tham khảo phụ tham chiếu từ `.claude/資料/`** (bước 5.5). Wireframe (PDF) được đọc từ `trion-doc/docs/public/requirements/` như trước (không thay đổi)
- Tên file tài liệu tham khảo phụ có kèm ngày phiên bản, nên khi tham chiếu **chọn phiên bản mới nhất bằng glob** (không hardcode)
- Đọc tài liệu theo định dạng: pdf=đọc trực tiếp bằng Read / xlsx=`openpyxl` / docx=thư viện chuẩn(zipfile) / pptx=`python-pptx` (khi cần xác nhận trực quan dùng `soffice` chuyển sang PDF). **Chỉ trích xuất phần cần thiết** để tiết kiệm token (chi tiết xem bước 5.5)
- Tài liệu tham khảo phụ chỉ tham chiếu **những gì thực sự tồn tại**. Cấu trúc thư mục có thể thay đổi, nên tài liệu glob không cho kết quả được xử lý là "tài liệu chưa xác nhận", không dừng ngay cả khi không có ERD・biểu đồ CRUD・định nghĩa API liên kết・danh sách màn hình (tính nhất quán API liên kết thuộc lĩnh vực của `/review:api`)
