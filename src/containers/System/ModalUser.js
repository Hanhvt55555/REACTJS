import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
class ModalUser extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  toggle = () => {
    this.props.toggleFromParent();
  };

  render() {
    return (
      <Modal
        isOpen={this.props.isOpenModalUser}
        toggle={() => {
          this.toggle();
        }}
        className={"modal-user-container"}
        size="lg"
      >
        <ModalHeader
          className="modal-title"
          toggle={() => {
            this.toggle();
          }}
        >
          Create a new user
        </ModalHeader>
        <ModalBody>
          <div class="container">
            <div class="row">
              <div class="form-group col-md-6">
                <label for="inputEmail4">Email</label>
                <input
                  type="email"
                  class="form-control"
                  placeholder="Email"
                  name="email"
                />
              </div>
              <div class="form-group col-md-6">
                <label for="inputPassword4">Password</label>
                <input
                  type="password"
                  class="form-control"
                  name="password"
                  placeholder="Password"
                />
              </div>
            </div>
            <div class="row">
              <div class="form-group col-md-6">
                <label for="firstname">First name</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="First name"
                  name="firstName"
                />
              </div>
              <div class="form-group col-md-6">
                <label for="inputPassword4">Last name</label>
                <input
                  type="text"
                  class="form-control"
                  name="lastName"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="inputAddress">Address</label>
              <input
                type="text"
                class="form-control"
                name="address"
                placeholder="1234 Main St"
              />
            </div>
            <div class="form-row">
              <div class="form-group col-md-6">
                <label for="inputCity">Phone number</label>
                <input
                  type="text"
                  class="form-control"
                  id="inputCity"
                  name="phonenumber"
                />
              </div>
            </div>
            <div class="row">
              <div class="form-group col-md-3">
                <label for="inputState">Sex</label>
                <select name="gender" class="form-control">
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>
              <div class="form-group col-md-3">
                <label for="inputZip">Role</label>
                <select name="roleId" class="form-control">
                  <option value="1">Admin</option>
                  <option value="2">Doctor</option>
                  <option value="3">Patient</option>
                </select>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="px-3"
            color="primary"
            onClick={() => {
              this.toggle();
            }}
          >
            Do Something
          </Button>{" "}
          <Button
            className="px-3"
            color="secondary"
            onClick={() => {
              this.toggle();
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalUser);
