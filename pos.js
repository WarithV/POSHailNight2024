import * as items_info from 'items_info';
import { auth, db } from '/POSHailNight2024/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addOrder, orders, writeChanges } from '/POSHailNight2024/order-manager.js';
import { collection, query, where, orderBy, getDocs, getCountFromServer, Timestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

var system_status = false;

export function getSystemStatus() {
  return system_status;
}

$(document).ready(async function(){

  $("#back-to-home").click(function() {
    Swal.fire({
      title : "กำลังโหลด...",
      showConfirmButton : false,
      allowOutsideClick : false,
      allowEscapeKey : false,
      allowEnterKey : false,
      didOpen : () => {
        Swal.showLoading();
        window.open("/POSHailNight2024/", "_self");
      }
    });
  });

  $("#refresh").click(function() {
    Swal.fire({
      title : "กำลังโหลด...",
      showConfirmButton : false,
      allowOutsideClick : false,
      allowEscapeKey : false,
      allowEnterKey : false,
      didOpen : () => {
        Swal.showLoading();
        location.reload();
      }
    });
  });

  var userInfo = {};

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userInfo["uid"] = user.uid;
      userInfo["email"] = user.providerData[0].email;
      getUserInfo(user.uid);
    } else {
      window.open("/POSHailNight2024/", "_self");
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
      const q = query(collection(db, "users"), where("uid", "==", uid))
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

      if (userInfo.authorized[items_info.main_category]) {
        system_status = await getServerStatus();
      } else {
        $("#system-loader").hide();
        $("#errorMessage").html("คุณไม่มีสิทธิ์ในการเข้าถึงระบบ โปรดติดต่อฝ่ายเหรัญญิกหากคิดว่านี่คือข้อผิดพลาด");
        $("#errorCode").html("");
        $("#error").show();
      }
    } catch (error) {
      $("#system-loader").hide();
      $("#errorMessage").html("เกิดข้อผิดพลาดจากระบบ โปรดลองใหม่อีกครั้งในภายหลัง");
      $("#errorCode").html("");
      $("#error").show();
    }
  }

  async function getServerStatus() {
    const response = await fetch("https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=get-server-status&query=0");
    const data = await response.json();

    if (data.ready) {
      if (data.req_data.status == "Close") {
        $("#server-close-alert").show();
      }
      $("#system-loader").hide();
      $(".content").show();
      var element = document.querySelector("#items-list");
      var rect = element.getBoundingClientRect();

      let y = rect.y + window.scrollY - 8;

      $("#items-list, #cart-list, #orders-list-container").css("max-height", "calc(100vh - " + y + "px)");
    }
    return {"Open": true, "Close": false}[data.req_data.status];
  }

  function preload_img(url) {
    let img = new Image();
    img.src = url;
  }
  
  preload_img('assets/promptpay.png');
  preload_img('assets/thaiqrpayment.png');

  var items = items_info.items;
  var cart = {};
  var total_price = 0;
  var customer_note = "";
  var promo_code_list = {};
  var card_code_list = {};
  var docs_to_update_promo = {};

  for (var i in items) {
    preload_img(items[i].photo);
    var html = "";
    if (Object.keys(items[i]).indexOf("variation") > -1) {
      var variant_html = "";
      for (var j in items[i].variation) {
        variant_html += '<div class="item-variant">' +
            '<div class="item-variant-information">' + 
              '<h6 class="item-variant-name">' + items[i].variation[j].name + '</h6>' +
              '<h6 class="item-variant-price">' + items[i].variation[j].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' บาท</h6>' +
            '</div>' +
            ((!items[i].need_verification) ? '<div class="item-amount-adjust">' +
              '<span class="material-icons material-symbols-outlined filled w400 amount-adjust decrement">do_not_disturb_on</span>' +
              '<input class="form-control item-amount" type="number" name="' + i + '" variation="' + j + '" min="0" step="1" value="0">' +
              '<span class="material-icons material-symbols-outlined filled w400 amount-adjust increment">add_circle</span>' +
            '</div>' +
          '</div>' : '<button class="btn add-to-cart" name="' + i + '" type="button">เพิ่มลงตะกร้า</button>');
      }
      html = '<div class="card" id="' + i + '" data-bs-toggle="collapse" data-bs-target="#' + i + '-variation" aria-expanded="false" aria-controls="' + i + '-variation">' +
          '<div class="card-body">' +
            '<div class="item-header">' +
              '<div style="width:50px; height:50px; background:url(\'' + items[i].photo + '\') no-repeat center; background-size: contain;" class="item-img"></div>' +
              '<div class="item-information">' +
                '<h5 class="card-title item-name">' + items[i].name + '</h5>' +
                ((items[i].need_verification) ? '<h6 class="item-need-verify">(ต้องยืนยันสิทธิ์ก่อนซื้อ)</h6>' : '') +
              '</div>' +
              '<div class="item-collapse-btn">' +
                '<button class="btn" type="button" style="--bs-btn-active-border-color: transparent;">' +
                  '<span class="material-icons material-symbols-outlined filled w400">expand_more</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="collapse item-variation" id="' + i + '-variation">' +
          variant_html +
        '</div>';
    } else if (Object.keys(items[i]).indexOf("customization") > -1) {
      var customization_html = "";
      for (var j in items[i].customization) {
        var items_html = "";
        for (var k in items[i].customization[j].items) {
          var custom_item = items[i].customization[j].items[k].name;
          var price_change = items[i].customization[j].items[k].price_change;
          items_html += '<option value="' + k + '">' + custom_item + '' + ((price_change > 0) ? " (+" + price_change + " บาท)" : "") + '</option>';
        }
        customization_html += '<div class="customization-item">' + 
          '<h6>' + items[i].customization[j].name + '</h6>' + 
          '<select class="form-select mb-3 custom-select" name="' + j + '" aria-label="Large select example">' +
            '<option value="" selected disabled>โปรดเลือก</option>' +
            items_html +
          '</select>' +
        '</div>';
      }
      html = '<div class="card" id="' + i + '">' +
        '<div class="card-body">' +
          '<div class="item-header">' +
            '<div style="width:50px; height:50px; background:url(\'' + items[i].photo + '\') no-repeat center; background-size: contain;" class="item-img"></div>' +
            '<div class="item-information">' +
              '<h5 class="card-title item-name">' + items[i].name + '</h5>' +
              '<h6 class="item-price">' + items[i].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' บาท' + ((items[i].need_verification) ? '<span class="item-need-verify"> (ต้องยืนยันสิทธิ์ก่อนซื้อ)</span>' : '') + '</h6>' +
            '</div>' +
            '<button class="btn add-to-cart need-disabled" name="' + i + '" type="button" disabled>เพิ่มลงตะกร้า</button>' +
          '</div>' +
          '<div class="customization">' +
            customization_html +
          '</div>' +
        '</div>' +
      '</div>';
    } else {
      html = '<div class="card" id="' + i + '">' +
        '<div class="card-body">' +
          '<div class="item-header">' +
            '<div style="width:50px; height:50px; background:url(\'' + items[i].photo + '\') no-repeat center; background-size: contain;" class="item-img"></div>' +
            '<div class="item-information">' +
              '<h6 class="card-title item-name">' + items[i].name + '</h6>' +
              '<h6 class="item-price">' + items[i].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' บาท' + ((items[i].need_verification) ? '<span class="item-need-verify"> (ต้องยืนยันสิทธิ์ก่อนซื้อ)</span>' : '') + '</h6>' +
            '</div>' +
            ((!items[i].need_verification) ? '<div class="item-amount-adjust">' +
               '<span class="material-icons material-symbols-outlined filled w400 amount-adjust decrement">do_not_disturb_on</span>' +
               '<input class="form-control item-amount" type="number" name="' + i + '" min="0" step="1" value="0">' +
               '<span class="material-icons material-symbols-outlined filled w400 amount-adjust increment">add_circle</span>' +
             '</div>' : '<button class="btn add-to-cart" name="' + i + '" type="button">เพิ่มลงตะกร้า</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    $("#items-list").append(html);
  }
  
  $(".item-collapse-btn > .btn").closest(".card").click(function() {
    if ($(this).find(".item-collapse-btn > .btn").hasClass("show")) {
      $(this).find(".item-collapse-btn > .btn").removeClass("show");
      $(this).next().css("margin-top", "-60px");
      $(this).next().css("margin-bottom", "28px");
    } else {
      $(".item-collapse-btn > .btn").removeClass("show");
      $(".item-variation").collapse("hide");
      $(this).find(".item-collapse-btn > .btn").addClass("show");
      $(this).next().css("margin-top", "-40px");
      $(this).next().css("margin-bottom", "20px");
    }
  });

  $(".decrement").click(function(){
    if (parseInt($(this).parent().children(".item-amount").val()) > 0) {
      $(this).parent().children(".item-amount").val(parseInt($(this).parent().children(".item-amount").val()) - 1);
      var item_name = $(this).siblings(".item-amount").attr("name");
      var variant = $(this).siblings(".item-amount").attr("variation");
      var amount = parseInt($(this).siblings(".item-amount").val());
      updateCart(item_name, amount, variant);
    }
  });

  $(".increment").click(function(){
    $(this).parent().children(".item-amount").val(parseInt($(this).parent().children(".item-amount").val()) + 1);
    var item_name = $(this).siblings(".item-amount").attr("name");
    var variant = $(this).siblings(".item-amount").attr("variation");
    var amount = parseInt($(this).siblings(".item-amount").val());
    updateCart(item_name, amount, variant);
  });

  $(".item-amount").on("change", function(){
    var item_name = $(this).attr("name");
    var variant = $(this).attr("variation");
    var amount = parseInt($(this).val());
    updateCart(item_name, amount, variant);
  });

  $(".custom-select").on("change", function(){
    var parent_custom_form = $(this).closest(".card");
    var id = parent_custom_form.attr("id");
    var form_item = items[id].customization;
    var is_custom_form_complete = true;
    for (var i in form_item) {
      var selected = parent_custom_form.find(".customization-item select[name=" + i + "].custom-select").find(":selected").val();
      if (selected === undefined || selected === false || selected == "") {
        is_custom_form_complete = false;
      }
    }
    if (is_custom_form_complete) {
      parent_custom_form.find(".add-to-cart").prop('disabled', false);
    } else {
      parent_custom_form.find(".add-to-cart").prop('disabled', true);
    }
  });

  $(".add-to-cart").click(function() {
    var item_name = $(this).attr("name");
    var variant = $(this).attr("variation");
    var form_item = items[item_name].customization;
    var custom = [];
    for (var i in form_item) {
      var selected = $(this).closest(".card").find(".customization-item select[name=" + i + "].custom-select").find(":selected").val();
      custom.push([i, selected]);
    }
    var amount = 1;
    updateCart(item_name, amount, variant, custom);
  });

  $("#customer-note").on("change", function(){
    customer_note = $(this).val();
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
    var html = "<div style='width: 100%;'>" +
        "<table id='checkout-cart-table' class='cart-table'>" +
          "<tr>" +
            "<th colspan='2'>รายการ</th>" +
            "<th>ราคา</th>" +
          "</tr>" +
        "</table>" +
        "<table class='cart-summary' style='margin-top: 20px;'>" +
          "<tr>" +
            "<th>ราคารวม</th>" +
            "<th>" + total_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</th>" +
          "</tr>" +
        "</table>" +
        ((customer_note != "") ? "<p align='left' style='margin-top: 10px;'><span style='font-weight: 600;'>ความต้องการลูกค้า:</span> " + customer_note + "</p>" : "") +
        "<p style='margin-top: 20px;'>เมื่อรับเงินสดแล้วให้กด \"ดำเนินการต่อ\"</p>" +
      "</div>";
    
    Swal.fire({
      title: "ชำระเงินด้วยเงินสด",
      html: html,
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      willOpen : function() {
        for (var item_name in cart) {
          $("#checkout-cart-table").append("<tr class='cart-item' item='" + item_name + "'><td>" + cart[item_name].name + "" + ((cart[item_name].hasVariant) ? " (" + cart[item_name].variant + ")" : "") + "</td><td>x" + cart[item_name].amount + "</td><td>" + cart[item_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</td></tr>");
        }
      },
      preConfirm: async function() {
        var req_url = "https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=write-order&query=" + JSON.stringify(cart) + "&payment_method=เงินสด&customer_note=" + customer_note + "&main_category=" + items_info.main_category + "&cashier_name=" + userInfo.name;

        try {
          if (getSystemStatus()) {
            const response = await fetch(req_url);
            const data = await response.json();

            if (data.ready) {
              isSuccess = true;
              orderNum = data.req_data.orderNum;
              return true;
            }
          } else {
            isSuccess = true;
            orderNum = 1;
            return true;
          }
        } catch {
          return true;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async function(result) {
      if (result.isConfirmed && isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ!",
          html: "<p align='center'>เลขที่ออเดอร์ของลูกค้า คือ</p><div style='font-size:48px; font-weight:600;'>" + orderNum + "</div>",
          icon: "success",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "ปิดหน้าต่าง"
        });
        var items = [];
        for (var i in cart) {
          items.push({
            name: cart[i].name,
            variation: ((cart[i].variant) ? cart[i].variant : ""),
            amount: cart[i].amount,
            desc: customer_note
          });
        }
        var write_data = {
            done: false,
            items: items
          };
        if (getSystemStatus()) {
          writeChanges("order_add", parseInt(orderNum), write_data);
          for (var i in docs_to_update_promo) {
            for (var j in docs_to_update_promo[i]) {
              var data = {
                code : "",
              };
              data["history." + promo_code_list[i][j]] = {
                code : promo_code_list[i][j],
                timestamp : Timestamp.now()
              }
              data["status." + i] = "used";
              await updateDoc(doc(db, "promo_code", docs_to_update_promo[i][j]), data);
            }
          }
        }
        orders[orderNum] = write_data;
        addOrder(parseInt(orderNum), write_data);
        resetCart();
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
    var html = "<div id='checkout-summary' style='display: flex; flex-wrap: wrap; width: 100%; gap: 20px;'>" +
        "<div style='width: 100%;'>" +
          "<table id='checkout-cart-table' class='cart-table'>" +
            "<tr>" +
              "<th colspan='2'>รายการ</th>" +
              "<th>ราคา</th>" +
            "</tr>" +
          "</table>" +
          "<table class='cart-summary' style='margin-top: 20px;'>" +
            "<tr>" +
              "<th>ราคารวม</th>" +
              "<th>" + total_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</th>" +
            "</tr>" +
          "</table>" +
          ((customer_note != "") ? "<p align='left' style='margin-top: 10px;'><span style='font-weight: 600;'>ความต้องการลูกค้า:</span> " + customer_note + "</p>" : "") +
          "<p style='margin-top: 20px;'>เมื่อชำระเงินผ่าน PromptPay แล้วให้กด \"ดำเนินการต่อ\"</p>" +
          "<h4 style='font-weight: 600; color: var(--theme3);'>อย่าลืมถ่ายสลิปลูกค้า!!</h4>" +
        "</div>" +
        "<div style='width: 100%;'>" +
          "<div class='card' style='border: none; box-shadow: 1px 1px 8px rgba(0,0,0,0.2); border-radius: 15px; width: 95%; height: calc(100% - 20px); padding-bottom: 20px; max-width: 400px; margin: 0 auto;'>" +
            "<div class='card-header' style='background-color:#00558d; border-radius: 15px 15px 0 0;'>" +
              "<img src='assets/thaiqrpayment.png' height='30'>" +
            "</div>" +
            "<div class='card-body'>" +
              "<img src='assets/promptpay.png' height='30' style='display:block; margin: 0 auto; margin-bottom: 10px;'>" +
              "<img id='loaded-qr' src='https://promptpay.io/0915342288/" + total_price + ".png' height='200' style='display:block; margin: 0 auto; margin-bottom: 10px;'>" +
              "<p class='h5' align='center' style='font-weight: 600; margin-bottom: 20px;'>วริทธิ์ วัฒนพลาชัยกูร<br/>Warith Vatanaplachaigoon</p>" +
              "<table style='width: 100%;'>" +
                "<tr>" +
                  "<td style='text-align: left; vertical-align:middle;'>ยอดชำระ</td>" +
                  "<td style='text-align: right; vertical-align:middle;'><h3 style='font-weight: 600; margin: 0;'>" + total_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " บาท</h3></td>" +
                "</tr>" +
              "</table>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";
    
    Swal.fire({
      title: "ชำระเงินด้วย PromptPay",
      html: html,
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      customClass: "swal2-fullscreen",
      willOpen : function() {
        for (var item_name in cart) {
          $("#checkout-cart-table").append("<tr class='cart-item' item='" + item_name + "'><td>" + cart[item_name].name + "" + ((cart[item_name].hasVariant) ? " (" + cart[item_name].variant + ")" : "") + "</td><td>x" + cart[item_name].amount + "</td><td>" + cart[item_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</td></tr>");
        }
      },
      preConfirm: async function() {
        var req_url = "https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=write-order&query=" + JSON.stringify(cart) + "&payment_method=PromptPay&customer_note=" + customer_note + "&main_category=" + items_info.main_category + "&cashier_name=" + userInfo.name;

        try {
          if (getSystemStatus()) {
            const response = await fetch(req_url);
            const data = await response.json();
  
            if (data.ready) {
              isSuccess = true;
              orderNum = data.req_data.orderNum;
              return true;
            }
          } else {
            isSuccess = true;
            orderNum = 1;
            return true;
          }
        } catch {
          return true;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async function (result) {
      if (result.isConfirmed && isSuccess) {
        Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ!",
          html: "<p align='center'>เลขที่ออเดอร์ของลูกค้า คือ</p><div style='font-size:48px; font-weight:600;'>" + orderNum + "</div>",
          icon: "success",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "ปิดหน้าต่าง"
        });
        var items = [];
        for (var i in cart) {
          items.push({
            name: cart[i].name,
            variation: ((cart[i].variant) ? cart[i].variant : ""),
            amount: cart[i].amount,
            desc: customer_note
          });
        }
        var write_data = {
            done: false,
            items: items
          };
        if (getSystemStatus()) {
          writeChanges("order_add", parseInt(orderNum), write_data);
          for (var i in docs_to_update_promo) {
            for (var j in docs_to_update_promo[i]) {
              var data = {
                code : "",
              };
              data["history." + promo_code_list[i][j]] = {
                code : promo_code_list[i][j],
                timestamp : Timestamp.now()
              }
              data["status." + i] = "used";
              await updateDoc(doc(db, "promo_code", docs_to_update_promo[i][j]), data);
            }
          }
        }
        orders[orderNum] = write_data;
        addOrder(parseInt(orderNum), write_data);
        resetCart();
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
        resetCart();
      }
    });
  });

  async function updateCart(item_name, amount, variant, custom = []) {
    var isVariant = typeof variant !== 'undefined' && variant !== false;
    var isCustom = custom.length > 0;
    
    var ele_name = item_name;
    var full_name = items[item_name].name;
    var variation = [];
    var price = items[item_name].price;
    
    if (isVariant) {
      ele_name += "-" + variant;
      variation = [items[item_name].variation[variant].name];
      price = items[item_name].variation[variant].price;
    }
    if (isCustom) {
      for (var i in custom) {
        ele_name += "-" + custom[i][1];
        variation.push(custom[i][1]);
        price += items[item_name].customization[custom[i][0]].items[custom[i][1]].price_change;
      }
    }
    if (amount == 0) {
      delete cart[ele_name];
      $("#cart-table tr[item='"+ele_name+"']").remove();
    } else {
      if (items[item_name].need_verification) {
        var pass = await checkPromotion(items[item_name].promo_type);
        if (!pass) {
          return true;
        }
      }
      if (Object.keys(cart).indexOf(ele_name) == -1) {
        cart[ele_name] = {
          name : full_name,
          hasVariant : isVariant || isCustom,
          isSet : items[item_name].isSet,
          amount : amount,
          price : amount*price
        };
        if (isVariant || isCustom) {
          cart[ele_name].variant = variation.join(" ");
        }
        if (items[item_name].isSet) {
          cart[ele_name].set_categories = items[item_name].set_categories;
        } else {
          cart[ele_name].category = items[item_name].category;
        }
        if (items[item_name].need_verification) {
          cart[ele_name].promo_code = [promo_code_list[items[item_name].promo_type].reverse()[0] + "/" + card_code_list[items[item_name].promo_type].reverse()[0]];
        }
        $("#cart-table").append("<tr class='cart-item' item='" + ele_name + "'><td>" + cart[ele_name].name + "" + ((cart[ele_name].hasVariant) ? " (" + cart[ele_name].variant + ")" : "") + "</td><td>x" + cart[ele_name].amount + "</td><td>" + cart[ele_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿</td></tr>");
      } else {
        if (isCustom || items[item_name].need_verification) {
          cart[ele_name].amount += amount;
        } else {
          cart[ele_name].amount = amount;
        }
        cart[ele_name].price = cart[ele_name].amount*price;
        if (items[item_name].need_verification) {
          cart[ele_name].promo_code.push(promo_code_list[items[item_name].promo_type].reverse()[0] + "/" + card_code_list[items[item_name].promo_type].reverse()[0]);
        }
        $("#cart-table tr[item='"+ele_name+"']").children("td").eq(1).html("x" + cart[ele_name].amount);
        $("#cart-table tr[item='"+ele_name+"']").children("td").eq(2).html(cart[ele_name].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿");
      }
    }
    calculateTotalPrice();
  }

  function calculateTotalPrice() {
    total_price = 0;
    for (var i in cart) {
      total_price += cart[i].price;
    }
    $("#total-price").html(total_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "฿");
  }

  function resetCart() {
    cart = {};
    customer_note = "";
    total_price = 0;
    promo_code_list = {};
    card_code_list = {};
    docs_to_update_promo = {};
    $(".cart-item").remove();
    $("#total-price").html("0.00฿");
    $("#customer-note").val("");
    $(".item-amount").val(0);
    $(".add-to-cart.need-disabled").prop('disabled', true);
    $(".customization-item .custom-select").children("option").prop('selected', false);
    $(".customization-item .custom-select").children("option:first-child").prop('selected', true);
  }

  async function checkPromotion(promo_type) {
    var promotion_code;
    let qrscanner;
    var promo_success = false;
    var is_done_search = false;
    await Swal.fire({
      title: "ต้องมีรหัสโปรโมชัน",
      html: "<p align='center'>โปรดสแกน QR Code โปรโมชันเพื่อเพิ่มรายการนี้ลงในตะกร้า</p>" +
        "<div id='my-qr-reader'><div>กล้องกำลังทำงาน...</div></div>" +
        "<hr>" +
        "<p align='center'>หรือกรอกรหัสโปรโมชัน</p>" +
        "<form class='needs-validation' novalidate>" +
          "<input type='text' class='form-control form-control-lg' id='promo-code' pattern='[A-Za-z0-9]{8}' placeholder='กรอกรหัสโปรโมชัน' required>" +
          "<div class='invalid-feedback'>โปรดใส่รหัสโปรโมชันที่ถูกต้อง</div>" +
        "</form>",
      showCancelButton: true,
      confirmButtonColor: "#0970aa",
      cancelButtonColor: "#d33",
      confirmButtonText: "ดำเนินการต่อ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      willOpen: function() {
        Html5Qrcode.getCameras().then(devices => {
          if (devices && devices.length) {
            qrscanner = new Html5Qrcode("my-qr-reader");
            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
              $("#promo-code").val(decodedText);
              $(".swal2-confirm").click();
            };
            const config = { fps: 10, qrbox: 300 };

            qrscanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
          }
        });
      },
      preConfirm: async function() {
        qrscanner.stop();
        promotion_code = $("#promo-code").val();
        const q = query(collection(db, "promo_code"), where("code", "==", promotion_code), orderBy("expired"));
        const querySnapshot = await getDocs(q);
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count == 0) {
          Swal.fire({
            title: "ไม่พบรหัสโปรโมชัน",
            html: "<p>โปรดรับรหัสโปรโมชันทาง<span style='font-weight:600;'>ระบบตรวจสอบโปรโมชันบัตรแข็ง</span> แล้วลองใหม่อีกครั้ง</p>",
            icon: "error",
            confirmButtonColor: "#0970aa",
            confirmButtonText: "เข้าใจแล้ว"
          });
        } else {
          if (Object.keys(promo_code_list).indexOf(promo_type) == -1) {
            promo_code_list[promo_type] = [];
            card_code_list[promo_type] = [];
            docs_to_update_promo[promo_type] = [];
          }
          querySnapshot.forEach((doc) => {
            var data = doc.data();
            if (data.expired.toMillis() > Timestamp.now().toMillis()) {
              if (Object.keys(data).indexOf("status") == -1) {
                if (promo_code_list[promo_type].indexOf(promotion_code) == -1) {
                  promo_code_list[promo_type].push(promotion_code);
                  card_code_list[promo_type].push(data.card_no);
                  docs_to_update_promo[promo_type].push(doc.id);
                  promo_success = true;
                } else {
                  Swal.fire({
                    title: "รหัสโปรโมชันนี้ถูกใช้ไปแล้ว",
                    html: "<p>โปรดใช้รหัสโปรโมชันอื่นแล้วลองใหม่อีกครั้ง</p>",
                    icon: "error",
                    confirmButtonColor: "#0970aa",
                    confirmButtonText: "เข้าใจแล้ว"
                  });
                }
              } else if (Object.keys(data.status).indexOf(promo_type) == -1) {
                if (promo_code_list[promo_type].indexOf(promotion_code) == -1) {
                  promo_code_list[promo_type].push(promotion_code);
                  card_code_list[promo_type].push(data.card_no);
                  docs_to_update_promo[promo_type].push(doc.id);
                  promo_success = true;
                } else {
                  Swal.fire({
                    title: "รหัสโปรโมชันนี้ถูกใช้ไปแล้ว",
                    html: "<p>โปรดใช้รหัสโปรโมชันอื่นแล้วลองใหม่อีกครั้ง</p>",
                    icon: "error",
                    confirmButtonColor: "#0970aa",
                    confirmButtonText: "เข้าใจแล้ว"
                  });
                }
              } else if (data.status[promo_type] == "eligible_all") {
                promo_code_list[promo_type].push(promotion_code);
                card_code_list[promo_type].push(data.card_no);
                promo_success = true;
              } else if (data.status[promo_type] == "available") {
                if (promo_code_list[promo_type].indexOf(promotion_code) == -1) {
                  promo_code_list[promo_type].push(promotion_code);
                  card_code_list[promo_type].push(data.card_no);
                  docs_to_update_promo[promo_type].push(doc.id);
                  promo_success = true;
                } else {
                  Swal.fire({
                    title: "รหัสโปรโมชันนี้ถูกใช้ไปแล้ว",
                    html: "<p>โปรดใช้รหัสโปรโมชันอื่นแล้วลองใหม่อีกครั้ง</p>",
                    icon: "error",
                    confirmButtonColor: "#0970aa",
                    confirmButtonText: "เข้าใจแล้ว"
                  });
                }
              } else if (data.status[promo_type] == "used") {
                Swal.fire({
                  title: "บัตรใบนี้ใช้โปรโมชันนี้ไปแล้ว",
                  html: "<p>โปรดใช้บัตรแข็งใบอื่นแล้วลองใหม่อีกครั้ง</p>",
                  icon: "error",
                  confirmButtonColor: "#0970aa",
                  confirmButtonText: "เข้าใจแล้ว"
                });
              } else {
                Swal.fire({
                  title: "เกิดข้อผิดพลาดขณะใช้โปรโมชัน",
                  html: "<p>โปรดลองใหม่อีกครั้ง</p>",
                  icon: "error",
                  confirmButtonColor: "#0970aa",
                  confirmButtonText: "เข้าใจแล้ว"
                });
              }
              is_done_search = true;
              return;
            }
          });
          if (!is_done_search) {
            Swal.fire({
              title: "รหัสโปรโมชันหมดอายุ",
              html: "<p>โปรดรับรหัสโปรโมชันทาง<span style='font-weight:600;'>ระบบตรวจสอบโปรโมชันบัตรแข็ง</span> แล้วลองใหม่อีกครั้ง</p>",
              icon: "error",
              confirmButtonColor: "#0970aa",
              confirmButtonText: "เข้าใจแล้ว"
            });
          }
        }
      }
    }).then((result) => {
      if (result.isConfirmed && promo_success) {
        Swal.fire({
          title: "ใช้รหัสโปรโมชันสำเร็จ!",
          html: "ยินดีด้วย! รหัสโปรโมชันนี้สามารถใช้ได้กับรายการนี้",
          icon: "success",
          confirmButtonColor: "#0970aa",
          confirmButtonText: "ปิดหน้าต่าง"
        });
        return promo_success;
      } else if (!result.isConfirmed) {
        qrscanner.stop();
        return false;
      }
    });
    return promo_success;
  }
});
