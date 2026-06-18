import React, { Component } from "react";

import { connect } from "react-redux";
import { FormattedMessage } from "react-intl";

class About extends Component {
  render() {
    return (
      <div className="section-share section-about ">
        <div className="section-about-header">Thiên hạ đồn gì về tui</div>
        <div className="section-about-content">
          <div className="content-left">
            <iframe
              width="100%"
              height="400px"
              src="https://www.youtube.com/embed/147SkAVXEqM"
              title="#51 Kết Thúc Design Giao Diện Clone BookingCare.vn 4 | React.JS Cho Người Mới Bắt Đầu"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
          <div className="content-right">
            <p>
              Trong video này, chúng ta sẽ hoàn tất việc design giao diện theo
              trang bookingcare.vn. Chúng ta sẽ hoàn thiện những phần đang còn
              dang dở, để từ video tiếp theo, chúng ta sẽ bắt đầu làm về backend
              và react để tạo dữ liệu thật cho trang home design này. Các bạn
              nhận được gì khi kết thúc khóa học? <br />✔ Các bạn có thể làm chủ
              công nghệ, cũng như học được, biết được những kiến thức thực tế
              dùng tại các công ty hiện nay. Sau khi kết thúc khóa học này, mình
              tin chắc rằng dự án này đủ lớn, đủ thực tế để cho các bạn mới ra
              trường viết vào CV xin việc của mình ^^ <br />✔ Các bạn hiểu được
              1 FullStack Web Developer thì cần chuẩn bị những gì. Ở đây, mình
              không dám chắc 100% các bạn sẽ trở thành Fullstack Developer,
              nhưng nếu bạn chọn Frontend hay Backend thì khóa học này cũng cung
              cấp cho bạn nhiều điều bổ ích 💕💕💕
            </p>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language,
  };
};

export default connect(mapStateToProps)(About);
