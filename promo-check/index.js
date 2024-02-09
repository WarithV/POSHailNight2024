import { auth, db } from '/POSHailNight2024/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, getCountFromServer, doc, addDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

$(document).ready(function(){

  var userInfo = {};
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userInfo["uid"] = user.uid;
      userInfo["email"] = user.providerData[0].email;
      getUserInfo(user.uid);
    } else {
      window.open("/", "_self");
    }
  });

  async function getUserInfo(uid) {
    if (uid == null) {
      $("#content-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#errorCode").html("");
      $("#error").show();
      return true;
    }

    try {
      const q = query(collection(db, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count == 0) {
        $("#system-loader").hide();
        $("#errorMessage").html("ไม่พบข้อมูลผู้ใช้งานในระบบ โปรดติดต่อฝ่ายเหรัญญิกหากคิดว่านี่คือข้อผิดพลาด");
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
      $("#system-loader").hide();
      $(".content").show();
    } catch (error) {
      $("#system-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#errorCode").html("");
      $("#error").show();
    }
  }

  (() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          form.classList.add('not-valid')
          event.preventDefault()
          event.stopPropagation()
        } else {
          form.classList.remove('not-valid')
        }

        form.classList.add('was-validated')
      }, false)
    })
  })()

  var promo = {
    "combo_set_59" : {
      name : "เซ็ตคอมโบ ของทอด-เฉาก๊วยนมสด",
      status : false,
      type : ["มัน-หอม-ผักทอด", "เฉาก๊วยนมสด"]
    },
    "fortune_slip_free" : {
      name : "เซียมซีฟรี 1 ครั้ง",
      status : false,
      type : ["เซียมซี"]
    }
  }

  for (var i in promo) {
    $("#promo-status tbody").append("<tr>" +
          "<th scope='row'>" + promo[i].name + "</th>" +
          "<td class='promo-status' for='" + i + "'></td>" +
          "<td class='promo-action' for='" + i + "'></td>" +
        "</tr>");
  }

  $("#id-search-form").submit(async function(e) {
    var query = $("#id-field").val();
    if (query != "" && !$(this).hasClass("not-valid")) {
        promo_check(query.match(/[A-Za-z0-9]{8}(\-[A-Za-z0-9]{4}){3}\-[A-Za-z0-9]{12}/gi)[0]);
    }
    e.preventDefault();
  });

  var id, data;

  async function promo_check(card) {
    clearInterval(timer);
    $("#search-result").css("display", "none");
    $("#result-body").css("display", "none");
    $("#content-loader").show();
    var promo_code = "";
    var timer = 300;

    try {
      const q = query(collection(db, "promo_code"), where("card_no", "==", card));
      const querySnapshot = await getDocs(q);
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count == 0) {
        while (promo_code == "" || promo_code == "b0Bc2F0f") {
          promo_code = generateCode(8);
        }
        await addDoc(collection(db, "promo_code"), {
          card_no : card,
          code : promo_code,
          expired : Timestamp.fromMillis(Timestamp.now().toMillis() + 5*60*1000)
        });
      } else {
        querySnapshot.forEach((doc) => {
          id = doc.id;
          data = doc.data();
          return;
        });
        for (var i in data.status) {
          promo[i].status = data.status[i] != "available" && data.status[i] != "eligible_all" && data.status[i] !== undefined && data.status[i] !== null;
        }
        if (data.expired.toMillis() > Timestamp.now().toMillis()) {
          promo_code = data.code;
          timer = Math.floor((data.expired.toMillis() - Timestamp.now().toMillis()) / 1000);
        } else {
          while (promo_code == "" || promo_code == "b0Bc2F0f") {
            promo_code = generateCode(8);
          }
          await updateDoc(doc(db, "promo_code", id), {
            card_no : card,
            code : promo_code,
            expired : Timestamp.fromMillis(Timestamp.now().toMillis() + 5*60*1000)
          });
        }
      }
      for (var i in promo) {
        var authorized = promo[i].type.filter(function(item) {
          return userInfo.authorized[item];
        }).length != 0;
        if (!promo[i].status) {
          $(".promo-status[for='" + i + "']").html('<span style="color: #34a853;"><span class="material-icons material-symbols-outlined filled w400">check_circle</span> สามารถใช้ได้</span>');
          if (authorized) {
            $(".promo-action[for='" + i + "']").html('<button class="btn btn-danger promo-use" for="' + i + '">ปิดการใช้โปรโมชัน</button>');
          }
        } else {
          $(".promo-status[for='" + i + "']").html('<span style="color: #ea4335;"><span class="material-icons material-symbols-outlined filled w400">cancel</span> ใช้ไปแล้ว</span>');
          $(".promo-action[for='" + i + "']").html('');
        }
      }
      $("#status-icon").html("check_circle");
      $("#status").html("รับสิทธิ์สำเร็จ");
      $("#status-update").html("โปรดกรอกรหัสหรือสแกน QR Code ด้านล่างในระบบ POS");
      $("#status, #status-icon, #status-update").css("color", "#34a853");
      $(".details, .card-footer").hide();
      $("#promo-code").html(promo_code);
      $("#qrcode").html("");
      var qrcode = new QRCode("qrcode", promo_code);
      countdown(timer, $("#countdown"));
      $("#result-body").css("display", "flex");
      document.getElementById('search-result').scrollIntoView();
    } catch (error) {
      $("#status-icon").html("error");
      $("#status").html("เกิดข้อผิดพลาดจากระบบ");
      $("#status-update").html("โปรดลองอีกครั้งในภายหลัง");
      $("#status, #status-icon, #status-update").css("color", "#ea4335");
      $(".details, .card-footer").hide();
      throw error;
    }

    $("#search-result").css("display", "block");
    $("#content-loader").hide();
  }

  $(document).on("click", ".promo-use", function() {
    var promo_id = $(this).attr("for");
    Swal.fire({
      title: "คุณกำลังจะปิดการใช้โปรโมชัน " + promo[promo_id].name,
      html : "และจะใช้ QR Code มหัศจรรย์ โดยฝ่ายเหรัญญิกจะสอบถามเหตุผลจากท่านทีหลัง <b>การดำเนินการนี้ไม่สามารถยกเลิกได้</b> ดำเนินการต่อหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก"
    }).then(async function(result) {
      if (result.isConfirmed) {
        var data = {
          all_purpose_qr_used : true
        };
        data["status." + promo_id] = "used";
        await updateDoc(doc(db, "promo_code", id), data).then(function() {
          Swal.fire({
            title: "สำเร็จ",
            html: "ปิดการใช้โปรโมชัน " + promo[promo_id].name + "เรียบร้อยแล้ว",
            icon: "success",
            confirmButtonColor: "#0970aa",
            confirmButtonText: "ปิดหน้าต่าง"
          });
          promo[promo_id].status = true;
          $(".promo-status[for='" + promo_id + "']").html('<span style="color: #ea4335;"><span class="material-icons material-symbols-outlined filled w400">cancel</span> ใช้ไปแล้ว</span>');
          $(".promo-action[for='" + promo_id + "']").html('');
        }).catch(function(error) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            html: error.message + "(" + error.code + ")",
            icon: "error",
            confirmButtonColor: "#0970aa",
            confirmButtonText: "เข้าใจแล้ว"
          });
        });
      }
    });
  });

  function generateCode(length) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var code = ""
    for (var i = 0, n = charset.length; i < length; i++) {
      code += charset.charAt(Math.floor(Math.random() * n));
    }
    return code;
  }

  var timer;

  function countdown(duration, element) {
    var time_left = duration;
    var minutes = parseInt(time_left / 60, 10);
    var seconds = parseInt(time_left % 60, 10);
    element.html(String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0'));
    time_left -= 1;
    timer = setInterval(function() {
      minutes = parseInt(time_left / 60, 10);
      seconds = parseInt(time_left % 60, 10);
      element.html(String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0'));
      time_left -= 1;
    }, 1000);
    setTimeout(function() {
      clearInterval(timer);
    }, duration*1000);
  }

  function logOut() {
    $(".content").hide();
    $("#system-loader").show();
    signOut(auth).then(() => {
      return true;
    }).catch((error) => {
      const errorCode = error.code;
      $("#system-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#errorCode").html("(" + errorCode + ")");
      $("#error").show();
    });
  }

  $("#logout").click(function() {
    Swal.fire({
      title: "คุณกำลังจะออกจากระบบ",
      text: "ดำเนินการต่อหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก"
    }).then((result) => {
      if (result.isConfirmed) {
        logOut();
      }
    });
  });
});
