import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { emitter } from "../../utils/emitter";
import _ from "lodash"; // thư viện hỗ trợ so sánh 2 object có giống nhau hay không
class ModalEditUser extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state = {
      id: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      address: "",
    };
  }

  componentDidMount() {
    let user = this.props.currentUser;
    if (user && !_.isEmpty(user)) {
      this.setState({
        id: user.id,
        email: user.email,
        password: "hardcode",
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
      });
    }
    //let {currentUser} = this.props;
    console.log("didmount edit modal", this.props.currentUser);
  }
  toggle = () => {
    this.props.toggleFromParent();
  };

  handleOnChangeInput = (event, id) => {
    //good code
    let copyState = { ...this.state };
    //console.log("check copy state", copyState);
    copyState[id] = event.target.value;
    this.setState({
      ...copyState,
    });

    //console.log(event.target.value, id);
  };

  checkValidateInput = () => {
    let isValid = true;
    let arrInput = ["email", "password", "firstName", "lastName", "address"];
    for (let i = 0; i < arrInput.length; i++) {
      console.log("check state input", this.state[arrInput[i]], arrInput[i]);
      if (!this.state[arrInput[i]]) {
        isValid = false;
        alert("Missing parameter: " + arrInput[i]);
        break;
        return false;
      }
    }
    return isValid;
  };

  handleSaveUser = () => {
    let isValid = this.checkValidateInput();
    if (isValid === true) {
      //call api edit user
      this.props.editUser(this.state);
    }
  };

  render() {
    console.log("check props from parent; ", this.props);
    return (
      <Modal
        isOpen={this.props.isOpenModalEditUser}
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
          Edit user
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
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "email");
                  }}
                  value={this.state.email}
                  disabled
                />
              </div>
              <div class="form-group col-md-6">
                <label for="inputPassword4">Password</label>
                <input
                  type="password"
                  class="form-control"
                  name="password"
                  placeholder="Password"
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "password");
                  }}
                  value={this.state.password}
                  disabled
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
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "firstName");
                  }}
                  value={this.state.firstName}
                />
              </div>
              <div class="form-group col-md-6">
                <label for="inputPassword4">Last name</label>
                <input
                  type="text"
                  class="form-control"
                  name="lastName"
                  placeholder="Last name"
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "lastName");
                  }}
                  value={this.state.lastName}
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
                onChange={(event) => {
                  this.handleOnChangeInput(event, "address");
                }}
                value={this.state.address}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="px-3"
            color="primary"
            onClick={() => {
              this.handleSaveUser();
            }}
          >
            Save changes
          </Button>{" "}
          <Button
            className="px-3"
            color="secondary"
            onClick={() => {
              this.toggle();
            }}
          >
            Close
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

export default connect(mapStateToProps, mapDispatchToProps)(ModalEditUser);
