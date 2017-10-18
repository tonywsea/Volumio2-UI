class AuthEditProfileController {
  constructor($scope, $state, authService, $q, $filter, modalService) {
    'ngInject';
    this.$scope = $scope;
    this.$state = $state;
    this.authService = authService;
    this.$q = $q;
    this.filteredTranslate = $filter('translate');
    this.modalService = modalService;

    this.user = null;
    this.emailChanged = false;

    this.form = {};

    this.avatarFile = {};
    this.isAvatarChanged = false;
    this.uploadingAvatar = false;

    this.deletingUser = false;

    this.init();
  }

  init() {
    this.authInit();
  }

  authInit() {
    this.authService.getUserPromise(false).then((user) => {
      this.postAuthInit(user);
      this.authService.bindWatcher(this.getAuthWatcher(), false);
    }).catch((error) => {
      this.modalService.openDefaultErrorModal(error);
    });
  }

  getAuthWatcher() {
    return (user) => {
      this.postAuthInit(user);
    };
  }

  postAuthInit(user) {
    this.setUser(user);
  }

  setUser(user) {
    this.user = user;
    this.copyValuesToForm();
  }

  copyValuesToForm() {
    for (var key in this.user) {
      if(key.startsWith("$") || key === 'forEach'){
        continue;
      }
      this.form[key] = this.user[key];
    }
  }

  copyValuesToUser() {
    for (var key in this.form) {
      if(key.startsWith("$") || key === 'forEach'){
        continue;
      }
      this.user[key] = this.form[key];
    }
  }

  goToProfile() {
    this.$state.go('volumio.auth.profile');
  }

  isUserFilledWithMandatory() {
    return this.authService.isUserFilledWithMandatory(this.user);
  }

  doEdit() {
    var promises = [];
    if (this.form.password) {
      if (!this.validatePasswordMatch()) {
        return;
      }
      var updatingPassword = this.updatePassword();
      promises.push(updatingPassword);
    }
    if (this.emailChanged === true) {
      var updatingEmail = this.updateEmail();
      promises.push(updatingEmail);
    }
    this.$q.all(promises).then(() => {
      this.updateUserData();
    }).catch(error => {
      this.modalService.openDefaultErrorModal(error);
    });
  }

  updateUserData() {
    this.copyValuesToUser();
    this.authService.saveUserData(this.user).then(() => {
      this.goToProfile();
    }).catch((error) => {
      this.modalService.openDefaultErrorModal(error);
    });
  }

  updatePassword() {
    var updating = this.$q.defer();
    this.authService.updatePassword(this.form.password).then(() => {
      updating.resolve();
    }).catch((error) => {
      updating.reject(error);
    });
    return updating.promise;
  }

  updateEmail() {
    var updating = this.$q.defer();
    this.authService.updateEmail(this.form.email).then(() => {
      updating.resolve();
    }).catch((error) => {
      updating.reject(error);
    });
    return updating.promise;
  }

  validatePasswordMatch() {
    if (this.form.password === this.passwordConfirm) {
      return true;
    }

    this.modalService.openDefaultErrorModal("AUTH.ERROR_VALIDATION_PASSWORD_MATCH");
    return false;
  }

  notifyEmailChanged() {
    this.emailChanged = true;
  }

  avatarChange(file) {
    this.isAvatarChanged = true;
    this.$scope.$apply();
    this.avatarFile = file;
  }

  saveAvatar() {
    this.uploadingAvatar = true;
    this.authService.changeAvatar(this.avatarFile, this.user.uid).then((url) => {
      this.uploadingAvatar = false;
      this.isAvatarChanged = false;
      this.user.photoUrl = url;
    }).catch((error) => {
      this.modalService.openDefaultErrorModal(error);
    });
  }

  logIn() {
    this.$state.go('volumio.auth.login');
  }

  deleteUser() {
    if (!confirm(this.filteredTranslate('AUTH.CONFIRM_DELETE_ACCOUNT'))) { //TODO Y/N MODAL
      return;
    }
    this.deletingUser = true;
    this.authService.deleteUser(this.user).then(() => {
      this.deletingUser = false;
      this.$state.go('volumio.auth.login');
    }).catch(error => {
      this.deletingUser = false;
      this.modalService.openDefaultErrorModal(error);
    });
  }

}

export default AuthEditProfileController;
