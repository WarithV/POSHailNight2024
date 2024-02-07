import { auth, db } from '/POSHailNight2024/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

$(document).ready(async function(){

  $("#system-loader").hide();
  $(".content").show();
  $("#login, #home").hide();

  var userInfo = {};

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userInfo["uid"] = user.uid;
      userInfo["email"] = user.providerData[0].email;
      getUserInfo(user.uid);
    } else {
      $("#greeting").html("โปรดเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย (@student.mahidol.edu) ก่อนเข้าใช้งาน");
      $("#greeting").show();
      $("#login").show();
      $("#content-loader").hide();
      userInfo = {};
      google.accounts.id.prompt();
    }
  });

  async function getUserInfo(uid) {
    if (uid == null) {
      $("#content-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#logout").show();
      $("#errorCode").html("");
      $("#error").show();
      return true;
    }

    try {
      const q = query(collection(db, "users"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q);
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count == 0) {
        $("#content-loader").hide();
        $("#errorMessage").html("ไม่พบข้อมูลผู้ใช้งานในระบบ โปรดติดต่อฝ่ายเหรัญญิกหากคิดว่านี่คือข้อผิดพลาด");
        $("#logout").show();
        $("#errorCode").html("");
        $("#error").show();
        return true;
      }
      querySnapshot.forEach((doc) => {
        var data = doc.data();
        userInfo["name"] = data.name;
        userInfo["authorized"] = data.authorized;
      });

      $("#greeting").html("ยินดีต้อนรับ " + userInfo.name + " (" + userInfo.email + ")");
      $("#greeting").show();
      $("#logout, #promo-check").show();
      $("#home").show();
      $("#content-loader").hide();
      runAuthorized();
    } catch (error) {
      $("#content-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#logout").show();
      $("#errorCode").html("");
      $("#error").show();
    }
  }

  const system_link = {
    "มัน-หอม-ผักทอด" : {
      name: "มัน/หอม/ผักทอด",
      url: "fried-veggies",
      photo: "assets/มันทอด.png"
    },
    "เฉาก๊วยนมสด" : {
      name: "เฉาก๊วยนมสด",
      url: "grass-jelly-milk",
      photo: "assets/เฉาก๊วยนมสด.png"
    },
    "เซียมซี" : {
      name: "เซียมซี",
      url: "fortune-slip",
      photo: "assets/เซียมซี.png"
    }
  }

  function runAuthorized() {
    $("#service-cards").html("");
    for (var i in system_link) {
      if (userInfo.authorized[i]) {
        var html = '<div class="col-md-6 col-12">' +
            '<div class="card text-center" href="' + system_link[i].url + '">' +
              '<div style="height:50px; background:url(\'' + system_link[i].photo + '\') no-repeat center; background-size: contain; margin-bottom:10px;"></div>' +
              '<h5 class="card-title">' + system_link[i].name + '</h5>' +
            '</div>' +
          '</div>';
        $("#service-cards").append(html);
      }
    }
    if ($("#service-cards").html() == "") {
      $("#error").show();
      $("#logout").show();
      $("#service-cards").html("<h6 style='color: var(--theme3);'>คุณไม่มีสิทธิ์ในการเข้าถึงระบบ โปรดติดต่อฝ่ายเหรัญญิกหากคิดว่านี่คือข้อผิดพลาด</h6>");
    }
  }

  $(document).on("click", "#service-cards .card", function() {
    Swal.fire({
      title : "กำลังโหลด...",
      showConfirmButton : false,
      allowOutsideClick : false,
      allowEscapeKey : false,
      allowEnterKey : false,
      didOpen : () => {
        Swal.showLoading();
        window.open($(this).attr("href"), "_self");
      }
    });
  });

  /*$(".item-collapse-btn > .btn").closest(".card").on("click", function() {
    $(this).find(".item-collapse-btn > .btn").click();
    $(this).next(".item-variation").toggle();
  });*/
});
