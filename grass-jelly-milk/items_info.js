export const main_category = "เฉาก๊วยนมสด";

export const items = {
  "เฉาก๊วยนมสด" : {
    name : "เฉาก๊วยนมสด",
    category : "เฉาก๊วยนมสด",
    price : 35,
    photo : "assets/เฉาก๊วยนมสด.png"
  },
  "ส่วนลดเฉาก๊วยนมสด" : {
    name : "ส่วนลดเฉาก๊วยนมสด",
    category : "เฉาก๊วยนมสด",
    price : -5,
    photo : "assets/เฉาก๊วยนมสด.png"
  },
  "เซ็ตคอมโบ" : {
    name : "เซ็ตคอมโบ ของทอด + เฉาก๊วยนมสด",
    isSet : true,
    set_categories : ["มัน-หอม-ผักทอด", "เฉาก๊วยนมสด"],
    customization : {
      "ประเภทของทอด": {
        name: "เลือกประเภทของทอด",
        items: {
          "มันทอด" : {
            name: "มันทอด",
            price_change: 0
          },
          "หอมทอด" : {
            name: "หอมทอด",
            price_change: 0
          },
          "ฟักทองทอด" : {
            name: "ฟักทองทอด",
            price_change: 0
          },
          "เห็ดเข็มทองทอด" : {
            name: "เห็ดเข็มทองทอด",
            price_change: 0
          },
          "รวมมิตรของทอด" : {
            name: "รวมมิตรของทอด",
            price_change: 0
          },
        }
      },
      "รสชาติของทอด" : {
        name: "เลือกรสชาติของทอด",
        items: {
          "ไม่ใส่ผง" : {
            name: "ไม่ใส่ผง",
            price_change: 0
          },
          "รสบาร์บีคิว" : {
            name: "รสบาร์บีคิว",
            price_change: 0
          },
          "รสปาปริก้า" : {
            name: "รสปาปริก้า",
            price_change: 0
          },
          "รสชีส" : {
            name: "รสชีส",
            price_change: 0
          },
          "ผสมรส" : {
            name: "ผสมรส",
            price_change: 0
          }
        }
      }
    },
    price : 59,
    need_verification : true,
    promo_type: "combo_set_59",
    photo : "assets/เซ็ตคอมโบ ของทอด+เฉาก๊วยนมสด.png"
  }
};
