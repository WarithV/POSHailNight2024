import * as items_info from 'items_info';
import { getSystemStatus } from '/pos.js';
import { db } from '/firebase.js';
import { doc, updateDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function getAllOrders(order_from = 1) {
  const response = await fetch("https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=get-orders&query=" + items_info.main_category + "&order_from=" + order_from);
  const data = await response.json();

  if (data.ready) {
    if (data.found) {
      latest_order_num = parseInt(sorted(Object.keys(data.req_data)).reverse()[0]);
      return data.req_data;
    }
  }
}

export var orders = await getAllOrders(1);
var items = items_info.items;

var pending = {};
var done = {};
var sales_stat = {};
var latest_order_num;

sorted(Object.keys(orders)).forEach(i => {
  addOrder(i, orders[i]);
});
orderUpdated();
$(function() {
  $("#order-loader").hide();
  $("#orders-list-container").show();
});

$(document).ready(async function(){

  var firstSnapshot = true;
  var unsubscribe;
  getStat();

  function subscribe(sub) {
    if (!getSystemStatus()) {
      return true;
    }
    if (sub) {
      unsubscribe = onSnapshot(doc(db, "order_change", items_info.main_category), (doc) => {
        if (!firstSnapshot) {
          if (!doc.metadata.hasPendingWrites) {
            var data = doc.data();
            if (data.type == "order_add") {
              orders[data.at] = data.data;
              addOrder(data.at, data.data);
              getStat();
            } else if (data.type == "order_change") {
              changeOrder(data.at, data.data.done);
            }
          }
        } else {
          firstSnapshot = false;
        }
      });
    } else {
      unsubscribe();
      firstSnapshot = true;
      unsubscribe = null;
    }
  }

  $("#toggle-auto-update").change(function(){
    var checked = $(this).is(":checked");
    $("#order-refresh").prop("disabled", checked);
    subscribe(checked);
  });

  $(document).on("change", ".order-checker input[type='checkbox']", async function() {
    var order_num = $(this).attr("order");
    var checked = $(this).is(":checked");
    changeOrder(order_num, checked);

    if (getSystemStatus()) {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=check-order&query=" + items_info.main_category + "&order_num=" + order_num + "&check=" + checked);
      const data = await response.json();
  
      if (data.ready) {
        if (data.found) {
          writeChanges("order_change", order_num, orders[order_num]);
          return true;
        }
      }

      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        text: "ขออภัย เกิดข้อผิดพลาดระหว่างส่งคำขอ โปรดลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonColor: "#0970aa",
        confirmButtonText: "เข้าใจแล้ว"
      });
      changeOrder(order_num, !checked);
    }
  });

  function changeOrder(order_num, checked) {
    var html = '<div class="card ' + ((checked) ? "completed" : "") + '" order="' + order_num + '">' +
      '<div class="card-body">' +
        '<div class="order-header">' +
          '<div class="order-checker">' +
            '<input class="form-check-input" type="checkbox" order="' + order_num + '" ' + ((checked) ? "checked" : "") + '>' +
          '</div>' +
          '<h2 class="order-number">' + order_num + '</h2>' +
          '<div class="order-items-list">' +
            $(".orders-list .card[order='" + order_num + "'] .order-items-list").html() +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    if (checked) {
      if (Object.keys(done).length == 0) {
        $("#done-orders").html("");
      }
      done[order_num] = pending[order_num];
      orders[order_num].done = true;
      var old_index = sorted(Object.keys(pending)).indexOf(order_num);
      var new_index = sorted(Object.keys(done)).reverse().indexOf(order_num);
      if ($("#done-orders .card").length - 1 < new_index) {
        $("#done-orders").append(html);
      } else {
        $("#done-orders .card").eq(new_index).before(html);
      }
      delete pending[order_num];
      $("#pending-orders .card").eq(old_index).remove();
    } else {
      if (Object.keys(pending).length == 0) {
        $("#pending-orders").html("");
      }
      pending[order_num] = done[order_num];
      orders[order_num].done = false;
      var old_index = sorted(Object.keys(done)).reverse().indexOf(order_num);
      var new_index = sorted(Object.keys(pending)).indexOf(order_num);
      if ($("#pending-orders .card").length - 1 < new_index) {
        $("#pending-orders").append(html);
      } else {
        $("#pending-orders .card").eq(new_index).before(html);
      }
      delete done[order_num];
      $("#done-orders .card").eq(old_index).remove();
    }
    orderUpdated();
  }

  $("[data-bs-toggle=popover]").popover();

  $("#order-refresh").click(async function(){
    $("#order-loader").show();
    $("#orders-list-container").hide();
    getStat();
    var new_orders = await getAllOrders(latest_order_num + 1);
    orders = Object.assign({}, orders, new_orders);
    sorted(Object.keys(new_orders)).forEach(i => {
      addOrder(i, new_orders[i]);
    });
    orderUpdated();
    $("#order-loader").hide();
    $("#orders-list-container").show();
  });

  async function getStat() {
    $(".stat-value").html("Loading...");
    $(".stat-value").addClass("placeholder");
    
    const response = await fetch("https://script.google.com/macros/s/AKfycbwVtMP4uunv1ijZoqtNiHoO6A2AlC1fRyXGKOuDUElIcRgphDoC62ip_mOKey8c9xuCFQ/exec?type=get-stat&query=" + items_info.main_category);
    const data = await response.json();

    if (data.ready) {
      if (data.found) {
        sales_stat = data.req_data;
        changeStat();
        return true;
      }
    }

    $(".stat-value").removeClass("placeholder");
    Swal.fire({
      title: "รับข้อมูลการขายไม่สำเร็จ",
      text: "ขออภัย เกิดข้อผิดพลาดระหว่างรับข้อมูลการขาย โปรดลองใหม่อีกครั้ง",
      icon: "error",
      confirmButtonColor: "#0970aa",
      confirmButtonText: "เข้าใจแล้ว"
    });
  }

  function changeStat() {
    $("#stat-goal").html(sales_stat.goal + " หน่วย");
    $("#stat-cost").html(sales_stat.cost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " บาท");
    $("#stat-sold").html(sales_stat.sold + " หน่วย");
    $("#stat-income").html(sales_stat.income.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " บาท");
    $("#stat-profit").html("<span style='color:" + ((sales_stat.profit < 0) ? "var(--theme3)" : "hsl(158, 49%, 39%)") + ";'>" + sales_stat.profit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " บาท</span>");
    $("#stat-order-amount-needed").html(((sales_stat.order_amount_needed < 0) ? "0" : sales_stat.order_amount_needed) + " หน่วย");
    $(".stat-value").removeClass("placeholder");
  }
});

export async function writeChanges(type, at, data) {
  await updateDoc(doc(db, "order_change", items_info.main_category), {
    type: type,
    at: at,
    data: data,
    timestamp: Timestamp.now()
  });
}

export function addOrder(key, data) {
  $(function() {
    var items_list = "";
    for (var i in data.items) {
      var item_info = Object.values(Object.keys(items).reduce(function (filtered, key) {
          if (items[key].name == data.items[i].name) filtered[key] = items[key];
          return filtered;
      }, {}))[0];
      items_list += '<div class="order-item">' +
          '<div style="width:50px; height:50px; background:url(\'' + item_info.photo + '\') no-repeat center; background-size: contain;" class="order-item-img"></div>' +
          '<div class="order-item-information">' +
            '<h5 class="card-title order-item-name">' + data.items[i].name + ' x' + data.items[i].amount + '</h5>' +
            ((data.items[i].variation != "") ? '<h6 class="order-item-variation">' + data.items[i].variation + '</h6>' : '') +
            ((data.items[i].desc != "") ? '<h6 class="order-item-desc">' + data.items[i].desc + '</h6>' : '') +
          '</div>' +
        '</div>';
    }
    var html = '<div class="card ' + ((data.done) ? "completed" : "") + '" order="' + key + '">' +
        '<div class="card-body">' +
          '<div class="order-header">' +
            '<div class="order-checker">' +
              '<input class="form-check-input" type="checkbox" order="' + key + '" ' + ((data.done) ? "checked" : "") + '>' +
            '</div>' +
            '<h2 class="order-number">' + key + '</h2>' +
            '<div class="order-items-list">' +
              items_list +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (data.done) {
      if (Object.keys(done).length == 0) {
        $("#done-orders").html("");
      }
      done[key] = data.items;
      $("#done-orders").prepend(html);
    } else {
      if (Object.keys(pending).length == 0) {
        $("#pending-orders").html("");
      }
      pending[key] = data.items;
      $("#pending-orders").append(html);
    }
  });
}

function orderUpdated() {
  $(function() {
    $("#pending-num").html(Object.keys(pending).length);
    $("#done-num").html(Object.keys(done).length);
    if (Object.keys(pending).length == 0) {
      $("#pending-orders").html('<p align="center" style="padding: 30px 0;">ไม่มีข้อมูล</p>');
    }
    if (Object.keys(done).length == 0) {
      $("#done-orders").html('<p align="center" style="padding: 30px 0;">ไม่มีข้อมูล</p>');
    }
    $("#order-last-updated").html(new Date().toLocaleString("th-TH", {dateStyle : "short", timeStyle : "short"}) + " น.");
  });
}

function sorted(arr) {
  return arr.sort(function(a, b){return a-b});
}