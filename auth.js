import { auth } from '/firebase.js';
import { signInWithCredential, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

$(document).ready(function(){

  google.accounts.id.initialize({
    client_id: "583639357893-2ldfvq0iaprp74pfit719oc7bbt5vffv.apps.googleusercontent.com",
    callback: signInWithGoogle,
    hd: "student.mahidol.edu"
  });
  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { 
      theme: "filled_blue", 
      text: "signin_with",
      size: "large"
    } 
  );

  function signInWithGoogle(response) {
    $("#greeting").hide();
    $("#login").hide();
    $("#error").hide();
    $("#content-loader").show();

    const idToken = response.credential;
    const credential = GoogleAuthProvider.credential(idToken);

    try {
      signInWithCredential(auth, credential).catch((error) => {
        const errorCode = error.code;
        $("#login").show();
        $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
        $("#errorCode").html("(" + errorCode + ")");
        $("#error").show();
        $("#content-loader").hide();
      });
    } catch (error) {
      if (error.code !== 'auth/internal-error' && error.message.indexOf('Cloud Function') !== -1) {
        $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
        $("#errorCode").html("");
        $("#error").show();
      }
    }
  }

  function logOut() {
    $("#greeting").hide();
    $("#logout").hide();
    $("#home").hide();
    $("#error").hide();
    $("#content-loader").show();
    signOut(auth).then(() => {
      return true;
    }).catch((error) => {
      const errorCode = error.code;
      $("#content-loader").hide();
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
