$(document).ready(function() {
// test url: ?gid=ahFzfnBsYXRmb3JtLTE1MTgyMXISCxIFR3JvdXAYgICAwvL57AoM&pid=2019_annual_buynow_ind_Basic
"use strict"

// chargebee controller 
var chargebee = (function(UIctrl) {

  var chargebeeInstance = Chargebee.init({
    site: "interplaylearning",
    enableGATracking: true,
  })

  return {
    createUserPlan: function() {
      email = $('#email').val().toLowerCase();
      var user = {
        gid: $('.checkout-plan__card.selected').attr('data-gid'),
        pid: $('.checkout-plan__card.selected').attr('data-pid')
      }
      console.log('create user plan', email, user.gid, user.pid);
      $.ajax({
        url: `https://api.interplaylearning.com/chargebee?email=${email}&plan_id=${user.pid}&group_id=${user.gid}`,
        type: 'GET',
      }).done(function(status) {
        UIController.nextStep(2);
        console.log('New Account Created');
      }).fail(function(status) {
        formError();
        disableBtn(2);
        console.log('fail', status.responseText)
        // showErrorMessage();
      });
    },

    openCheckout: function(accountDetails) {
      var accountDetails = {
        "first_Name": $('#first-name').val(),
        "last_Name": $('#last-name').val(),
        "email": $('#email').val().toLowerCase(),
        "phone": $('#phone-number').val(),
        "company": $('#company').val(),
        "plan_id": $('.checkout-plan__card.selected').attr('data-pid'),
        // "group_id": $('.checkout-plan__card.selected').attr('data-gid'),
      }

      console.table(accountDetails)

      chargebeeInstance.openCheckout({
        hostedPage: function() {
          return $.ajax({
            method: 'POST',
            url: 'https://api.interplaylearning.com/chargebee/',
            data: accountDetails, //See endpoint notes on "Created a Hosted Page in SkillMill" for what this needs to contain
          });
        },
        loaded: function() {
          console.log("checkout opened");
        },
        error: function() {
          $("#loader").hide();
          $("#errorContainer").show();
        },
        close: function() {
          $("#loader").hide();
          $("#errorContainer").hide();
          console.log("checkout closed");
        },
        success: function(hostedPageId) {
          console.log(hostedPageId);
            //The hostedPageId returned here needs to be passed to the endpoint that creates the SkillMill user
        },
        step: function(value) {
          // value -> which step in checkout
          console.log(value);
        }
        });
    },
  }
})(UIController);

var UIController = (function(chargebee) {

  var el = {
    $continueBtn: $('.continue-btn'),
    $stepOneBtn: $('#step-1-btn'),
    $stepTwoBtn: $('#step-2-btn'),
    $stepThreeBtn: $('#step-3-btn'),
    $stepFourBtn: $('#step-4-btn'),
    $stepOneEl:  $('#step-1'),
    $stepTwoEl:  $('#step-2'),
    $planCard: $('.checkout-plan__card'),
    $planCardSelected: $('.checkout-plan__card.selected'),
    $summaryPlan: $('.summary__plan'),
    $summaryLicense: $('.summary__license'),
    $summaryPrice: $('.summary__price'),
    $progressBarItem: $('.checkout-progress__list-item'),
    $emailInput: $('#email'),
    $passwordInput: $('#password-1'),
    $confirmPasswordInput: $('#password-2')
  };

  getUrlParam = function(id) {
    var urlParams =  new URLSearchParams(window.location.search);
    if(urlParams.get(id)) {
        enableBtn('step-1-btn');
    }
    console.log(urlParams)
    return urlParams.get(id)
  };

  // gets plan data from DOM attr
  getPlan = function(el) {
    var plan = {
      name: el.attr('data-plan'),
      license: el.attr('data-license'),
      price: el.attr('data-price'),
      gid: el.attr('data-gid'),
      pid: el.attr('data-pid')
    }
    // sends data to summary card
    addPlanToDOM(plan);
  };

  // gets query strings and sets active plan card
  setPlanOnLoad = function(param) {
    el.$planCard.removeClass('selected');
    var $currentPlan = $(`.checkout-plan__card[data-pid=${param.pid}]`);
    $currentPlan.addClass('selected');
    getPlan($currentPlan);
  };

  // sets plan data to summary from DOM attr
  addPlanToDOM = function(plan) {
    el.$summaryPlan.text(plan.name);
    el.$summaryLicense.text(plan.license);
    el.$summaryPrice.text(plan.price);
  };

  hideForm = function(id) {
    $(`#step-${id}`).hide();
    // progressBarCompleted(id);
  };

  nextForm = function(id) {
    $(`#step-${id}`).addClass('open');
    $("#email").focus();
    // progressBarNextStep(id);
  };

  enableBtn = function(id) {
    $(`#${id}`).removeClass('disabled').attr('disabled', false);
  };

  disableBtn = function(id) {
    $(`#step-${id}-btn`).addClass('disabled').attr('disabled', true);
  };

  formError = function() {
    $('.error-msg').show();
    $('input').addClass('error');
    setTimeout(function() {
      $('.error-msg').hide();
      $('input').removeClass('error');
    }, 3000)
  };

  addErrorMsg = function(field, errorMessage, ) {
    field.after(`<span class="error-msg show"><i class="fa fa-exclamation-circle" aria-hidden="true"></i> ${errorMessage}</span>`)
    field.addClass('error');
    // setTimeout(function() {
    //   field.removeClass('error');
    //   $('.error-msg').removeClass('show');
    // }, 3000)
    removeErrorMsg(field);
  };

  removeErrorMsg = function(field) {
    field.on('keyup', function() {
      console.log('running remove error')
      if(field.val().length > 0) {
        console.log('should remove error')
        field.removeClass('error');
        $('.error-msg').removeClass('show');
      }
    })

  };

  progressBarCompleted = function(id) {
    var $progressItem = $(`.checkout-progress__list-item[data-step=step-${id}]`);
    $progressItem.removeClass('active').addClass('completed changeColor');
  } 

  progressBarNextStep = function(id) {
    var $progressItem = $(`.checkout-progress__list-item[data-step=step-${id}]`);
    $progressItem.addClass('active');
  }

  return {
    nextStep: function(id) {
      hideForm(id);
      nextForm(Number(id) + 1);
      progressBarCompleted(id);
      progressBarNextStep(Number(id) + 1);
    },

    handleContinueBtnClick: function() {
      var id = $(this).attr('data-step');
      if(id == 2) {
        this.createUserPlan();
      }
      UIController.nextStep(id);
    },

    selectPlanCard: function() {
      el.$planCard.removeClass('selected');
      $(this).addClass('selected');
      console.log('plan selected');
      getPlan($(this));
      enableBtn('step-1-btn');
    },

    setUrlParam: function() {
      var param = {
        gid: getUrlParam('gid'),
        pid: getUrlParam('pid'),
      }
      setPlanOnLoad(param);
    },

    validateEmail: function() {
      email = $('#email').val().toLowerCase();
      var expression = /\S+@\S+/
      if(expression.test(String(email).toLowerCase())) {
        enableBtn('step-2-btn');
      } else {
        disableBtn('step-2-btn');
      }
    },

    validatePasswordLength: function() {
     var passwordLength = ($(this).val().length);
      if(passwordLength < 6) {
        $('#password-error').show();
      } else {
        $('#password-error').hide();
      }
    },

    validatePasswordMatch: function() {
      var passwordOne = $('#password-1').val();
      var passwordTwo = $(this).val();
      var passwordLength = $(this).val().length;

      if(passwordLength > 5 && passwordOne === passwordTwo) {
        $('#confirm-password-error').hide();
        console.log('passwords match');
      } else {
        $('#confirm-password-error').show();
      }
    },

    checkAllRequiredFields: function() {
      isEmpty = false
      $('input:required').each(function() {
        if ($(this).val() === '') {
          addErrorMsg($(this), 'Please fill out required fields.')
          isEmpty = true;
        } else {
          removeErrorMsg($(this));
        }
      });

      if (!isEmpty) {
        chargebee.openCheckout();
      }
    },

    getDomEl: function() {
      return el;
    },
  };

})(chargebee);

// global controller
var controller = (function(UIctrl, chargebee) {

  var el = UIctrl.getDomEl();

  var bindEventListeners  = function() {
    el.$planCard.on('click', UIctrl.selectPlanCard);
    el.$emailInput.keyup(UIctrl.validateEmail);
    el.$stepOneBtn.on('click', UIctrl.handleContinueBtnClick);
    el.$stepTwoBtn.on('click', chargebee.createUserPlan);
    el.$passwordInput.on('keyup', UIctrl.validatePasswordLength);
    el.$confirmPasswordInput.on('keyup', UIctrl.validatePasswordMatch);
    el.$stepThreeBtn.on('click', UIctrl.checkAllRequiredFields);
  };
  
  return {
    init: function() {
      console.log('checkout app started v3')
      bindEventListeners();
      UIctrl.setUrlParam();   
    }
  }

})(UIController, chargebee);

controller.init();

});

// var planController = (function() {

//   // subscription plans
//   var plans = {
//     basic: {
//       gid: 'ahFzfnBsYXRmb3JtLTE1MTgyMXISCxIFR3JvdXAYgICAwvL57AoM',
//       pid: '2019_monthly_buynow_ind_Basic'
//     },
//     annual: {
//       gid: 'ahFzfnBsYXRmb3JtLTE1MTgyMXISCxIFR3JvdXAYgICAwvL57AoM',
//       pid: '2019_annual_buynow_ind_Basic'
//     },
//     annualPro: {
//       gid: 'ahFzfnBsYXRmb3JtLTE1MTgyMXISCxIFR3JvdXAYgICAwvL57AoM',
//       pid: '2019_annual_buynow_ind_Pro'
//     },
//   };
  
//   return {
//     getPlans: function() {
//       return plans;
//     }
//   }
// })();
