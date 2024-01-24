/*import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhoC2tMlqVfejhl1V0Cq0ngFpaEqjVBvc",
  authDomain: "treasurer-connect.firebaseapp.com",
  projectId: "treasurer-connect",
  storageBucket: "treasurer-connect.appspot.com",
  messagingSenderId: "583639357893",
  appId: "1:583639357893:web:4dc8c3c84c3972a6a4d3ac",
  measurementId: "G-1YS8YM8K8F"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();*/

$(document).ready(function(){

  $(".content").show();

  var items = {
    "มันเกลียว" : {
      name : "มันเกลียว",
      category : "มันเกลียว และ หอมทอด",
      price : 30,
      photo : "มันเกลียว.png"
    },
    "หอมทอด" : {
      name : "หอมทอด",
      category : "มันเกลียว และ หอมทอด",
      price : 30,
      photo : "หอมทอด.png"
    },
    "บัตร HN 2024" : {
      name : "บัตร HN 2024",
      category : "บัตร HN",
      price : 349,
      photo : "hailnight.png"
    }
  };
  var cart = {};
  var total_price = 0;

  for (var i in items) {
    var html = '<div class="card" id="' + items[i].name + '">' +
        '<div class="card-body">' +
          '<div style="width:70px; height:70px; background:url(\'' + items[i].photo + '\') no-repeat center; background-size: contain;" class="item-img"></div>' +
          '<div class="item-information">' +
            '<h4 class="card-title item-name">' + items[i].name + '</h4>' +
            '<h6 class="item-price">' + items[i].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' บาท</h6>' +
          '</div>' +
          '<div class="item-amount-adjust">' +
            '<span class="material-icons material-symbols-outlined filled w400 amount-adjust decrement">do_not_disturb_on</span>' +
            '<input class="form-control item-amount" type="number" name="' + items[i].name + '" min="0" step="1" value="0">' +
            '<span class="material-icons material-symbols-outlined filled w400 amount-adjust increment">add_circle</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    $("#items-list").append(html);
  }

  /*onAuthStateChanged(auth, (user) => {
    if (user) {
      memberInfo["uid"] = user.uid;
      getMemberInfo(user.providerData[0].email);
    } else {
      $("#login").show();
      $("#login-loader").hide();
      memberInfo = {};
      google.accounts.id.prompt();
    }
  });

  async function getMemberInfo(email) {
    if (email == null) {
      $("#login-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#logout_if_error").show();
      $("#errorCode").html("");
      $("#error").show();
    }
    var req_url = "https://script.google.com/macros/s/AKfycbwyykidmx6qj2biXN4d0amGEdKkq-VHt1YhIbipUFlarneQZ2fRKFo6LVIoweJ74Z2SfA/exec?type=member-info&query=" + email;

    try {
      const response = await fetch(req_url);
      const data = await response.json();

      if (data.ready) {
        if (data.found) {
          memberInfo = Object.assign({}, memberInfo, data.req_data);
          $("#displayName").html(memberInfo.ชื่อ + " " + memberInfo.นามสกุล + " (" + memberInfo.Email + ")");;
          $("#information").show();
          $("#login-loader").hide();
          getAllTicketStatus(memberInfo.Email);
        } else {
          $("#login-loader").hide();
          $("#errorMessage").html("ไม่พบข้อมูลผู้ใช้งานในรายชื่อสมาชิกบ้าน โปรดติดต่อฝ่ายเหรัญญิกหากคิดว่านี่คือข้อผิดพลาด");
          $("#logout_if_error").show();
          $("#errorCode").html("");
          $("#error").show();
        }
      } else {
        $("#login-loader").hide();
        $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
        $("#logout_if_error").show();
        $("#errorCode").html("");
        $("#error").show();
      }
    } catch {
      $("#login-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#logout_if_error").show();
      $("#errorCode").html("");
      $("#error").show();
    }
  }*/

  $(".decrement").click(function(){
    if (parseInt($(this).parent().children(".item-amount").val()) > 0) {
      $(this).parent().children(".item-amount").val(parseInt($(this).parent().children(".item-amount").val()) - 1);
      var item_name = $(this).siblings(".item-amount").attr("name");
      var amount = parseInt($(this).siblings(".item-amount").val());
      updateCart(item_name, amount);
    }
  });

  $(".increment").click(function(){
    $(this).parent().children(".item-amount").val(parseInt($(this).parent().children(".item-amount").val()) + 1);
    var item_name = $(this).siblings(".item-amount").attr("name");
    var amount = parseInt($(this).siblings(".item-amount").val());
    updateCart(item_name, amount);
  });

  $(".item-amount").on("change", function(){
    var item_name = $(this).attr("name");
    var amount = parseInt($(this).val());
    updateCart(item_name, amount);
  });

  $("#cash").click(function() {
    if (Object.keys(cart).length == 0) {
      Swal.fire({
        title: "ไม่มีรายการในตะกร้า",
        text: "คุณไม่สามารถดำเนินการชำระเงินได้หากไม่มีของในตะกร้า โปรดเพิ่มของในตะกร้าก่อน",
        icon: "info",
        confirmButtonColor: "#0970aa",
        confirmButtonText: "เข้าใจแล้ว"
      });
      return true;
    }
    var orderNum;
    var isSuccess = false;
    
    Swal.fire({
      title: "ชำระเงินด้วยเงินสด",
      text: "เมื่อรับเงินสดแล้วให้กด \"ดำเนินการต่อ\"",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
        preConfirm: async function() {
          var req_url = "https://script.google.com/macros/s/AKfycbxgbhMGiCe7QcAq4hdplRA2IR59JD2jkUJJqeC7hwb5IR4cpcGPBKVOB7Sv3Hy1Ba8wIQ/exec?type=write-order&query=" + JSON.stringify(cart) + "&payment_method=เงินสด";

          try {
            const response = await fetch(req_url);
            const data = await response.json();

            if (data.ready) {
              isSuccess = true;
              orderNum = data.req_data.orderNum;
              return true;
            }
          } catch {
            return true
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ!",
          text: "เลขที่ออเดอร์ของลูกค้า คือ " + orderNum,
          icon: "success",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "ปิดหน้าต่าง"
        });
        cart = {};
        total_price = 0;
        $(".cart-item").remove();
        $("#total-price").html("0.00฿");
        $(".item-amount").val(0);
      } else if (result.isConfirmed && !isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลไม่สำเร็จ",
          text: "ขออภัย เกิดข้อผิดพลาดระหว่างส่งคำขอ โปรดลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "เข้าใจแล้ว"
        });
      }
    });
  });

  $("#promptpay").click(function(){
    //genQR(10);
    /*const mobileNumber = '091-534-2288';
    const amount = total_price;
    const payload = generatePayload(mobileNumber, { amount });
    console.log(payload);

    // Convert to SVG QR Code
    const options = {
      type: 'svg',
      color: {
        dark: '#000',
        light: '#fff'
      }
    };
    qrcode.toString(payload, options, (err, svg) => {
        if (err) {
          return console.log(err);
        }
        //fs.writeFileSync('./qr.svg', svg);
        console.log(svg);
    });*/
    if (Object.keys(cart).length == 0) {
      Swal.fire({
        title: "ไม่มีรายการในตะกร้า",
        text: "คุณไม่สามารถดำเนินการชำระเงินได้หากไม่มีของในตะกร้า โปรดเพิ่มของในตะกร้าก่อน",
        icon: "info",
        confirmButtonColor: "#0970aa",
        confirmButtonText: "เข้าใจแล้ว"
      });
      return true;
    }
    var orderNum;
    var isSuccess = false;
    
    Swal.fire({
      title: "ชำระเงินด้วย PromptPay",
      html: "<p>เมื่อชำระเงินผ่าน PromptPay แล้วให้กด \"ดำเนินการต่อ\"</p><h4 style='color: var(--theme3); font-weight: 600;'>อย่าลืมถ่ายสลิปลูกค้า!!</h4>",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      preConfirm: async function() {
        var req_url = "https://script.google.com/macros/s/AKfycbxgbhMGiCe7QcAq4hdplRA2IR59JD2jkUJJqeC7hwb5IR4cpcGPBKVOB7Sv3Hy1Ba8wIQ/exec?type=write-order&query=" + JSON.stringify(cart) + "&payment_method=PromptPay";

        try {
          const response = await fetch(req_url);
          const data = await response.json();

          if (data.ready) {
            isSuccess = true;
            orderNum = data.req_data.orderNum;
            return true;
          }
        } catch {
          return true
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ!",
          text: "เลขที่ออเดอร์ของลูกค้า คือ " + orderNum,
          icon: "success",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "ปิดหน้าต่าง"
        });
        cart = {};
        total_price = 0;
        $(".cart-item").remove();
        $("#total-price").html("0.00฿");
        $(".item-amount").val(0);
      } else if (result.isConfirmed && !isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลไม่สำเร็จ",
          text: "ขออภัย เกิดข้อผิดพลาดระหว่างส่งคำขอ โปรดลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "เข้าใจแล้ว"
        });
      }
    });
  });

  $("#cart-reset").click(function() {
    Swal.fire({
      title: "คุณกำลังจะรีเซ็ตของในรายการ",
      text: "ดำเนินการต่อหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก"
    }).then((result) => {
      if (result.isConfirmed) {
        cart = {};
        total_price = 0;
        $(".cart-item").remove();
        $("#total-price").html("0.00฿");
        $(".item-amount").val(0);
      }
    });
  });

  function updateCart(item_name, amount) {
    if (amount == 0) {
      delete cart[item_name];
      $("#cart-table tr[item='"+item_name+"']").remove();
    } else {
      if (Object.keys(cart).indexOf(item_name) == -1) {
        cart[item_name] = {
          name : item_name,
          amount : amount,
          category : items[item_name].category,
          price : amount*items[item_name].price
        };
        $("#cart-table").append("<tr class='cart-item' item='" + item_name + "'><td>" + cart[item_name].name + "</td><td>x" + cart[item_name].amount + "</td><td>" + cart[item_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</td></tr>");
      } else {
        cart[item_name].amount = amount;
        cart[item_name].price = amount*items[item_name].price;
        $("#cart-table tr[item='"+item_name+"']").children("td").eq(1).html("x" + cart[item_name].amount);
        $("#cart-table tr[item='"+item_name+"']").children("td").eq(2).html(cart[item_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿");
      }
    }
    console.log(cart);
    calculateTotalPrice();
  }

  function calculateTotalPrice() {
    total_price = 0;
    for (var i in cart) {
      total_price += cart[i].price;
    }
    $("#total-price").html(total_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿");
  }

  /*function genQR(amount) {
    $.ajax({
      method: 'post',
      url: 'http://localhost:2000/generateQR',
      data: {
        amount: parseFloat(amount)
      },
      success: function(response) {
        console.log('good', response);
      },
      error: function(error) {
        console.log('bad', error);
      }
    })
  }*/
});
