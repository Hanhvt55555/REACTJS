import React, { Component } from "react";

import { connect } from "react-redux";

import Slider from "react-slick";

class OutstandingDoctor extends Component {
  render() {
    return (
      <div className="section-share section-outstanding-doctor ">
        <div className="section-container">
          <div className="section-header">
            <span className="title-section">Bác sĩ nổi bật</span>
            <button className="btn-section">Xem thêm</button>
          </div>
          <div className="section-body">
            <Slider {...this.props.settings}>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai1 </div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai 2 </div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai 3</div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai 4</div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai 5</div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
              <div className="section-customize">
                <div className="customize-border">
                  <div className="outer-bg">
                    <div className="bg-img section-outstanding-doctor" />
                  </div>
                  <div className="position text-center">
                    <div>Giáo sư, Tiến sĩ Hxinhgai 6 </div>
                    <div>Tâm thần </div>
                  </div>
                </div>
              </div>
            </Slider>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.user.isLoggedIn,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(OutstandingDoctor);
