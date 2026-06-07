import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { emitter } from "../../utils/emitter";
class ModalUser extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state = {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      address: "",
      phonenumber: "",
      gender: "",
      roleId: "",
    };
    this.listenToEmitter();
  }
  listenToEmitter() {
    emitter.on("EVENT_CLEAR_MODAL_DATA", () => {
      this.setState({
        email: "",
        password: "", 
        firstName: "",
      lastName: "",
      address: "",
      phonenumber: "",
      gender: "",
      roleId: "",  
    });
    })}

  componentDidMount() {
    console.log("mouting modal");
  }
  toggle = () => {
    this.props.toggleFromParent();
  };

  handleOnChangeInput = (event, id) => {
    //bad code: modified state directly
    // this.state[id] = event.target.value;
    // this.setState(
    //   {
    //     ...this.state,
    //   },
    //   () => {
    //     console.log("check state input", this.state);
    //   },
    // );

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
    let arrInput = [
      "email",
      "password",
      "firstName",
      "lastName",
      "address",
      "phonenumber",
      "gender",
      "roleId",
    ];
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

  handleAddNewUser = () => {
    let isValid = this.checkValidateInput();
    if (isValid === true) {
      //call api create modal
      //   console.log("data input", this.state);
      this.props.createNewUser(this.state);
      //console.log("check props from parent", this.props);
    }
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
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "email");
                  }}
                  value={this.state.email}
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
            <div class="form-row">
              <div class="form-group col-md-6">
                <label for="inputCity">Phone number</label>
                <input
                  type="text"
                  class="form-control"
                  id="inputCity"
                  name="phonenumber"
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "phonenumber");
                  }}
                  value={this.state.phonenumber}
                />
              </div>
            </div>
            <div class="row">
              <div class="form-group col-md-3">
                <label for="inputState">Sex</label>
                <select
                  name="gender"
                  class="form-control"
                  value={this.state.gender}
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "gender");
                  }}
                >
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>
              <div class="form-group col-md-3">
                <label for="inputZip">Role</label>
                <select
                  name="roleId"
                  class="form-control"
                  value={this.state.roleId}
                  onChange={(event) => {
                    this.handleOnChangeInput(event, "roleId");
                  }}
                >
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
              this.handleAddNewUser();
            }}
          >
            Add new
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

export default connect(mapStateToProps, mapDispatchToProps)(ModalUser);
