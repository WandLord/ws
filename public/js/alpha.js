function changeViewLeftPanel(identifiquier) {
    var dep = document.getElementById("deposit");
    var wit = document.getElementById("withdraw");
    var his = document.getElementById("history");
    var bt_dep = document.getElementById("btn_deposit");
    var bt_wit = document.getElementById("btn_withdraw");
    var bt_his = document.getElementById("btn_history");

    bt_dep.className = bt_dep.className.replace(" active", "");
    bt_wit.className = bt_wit.className.replace(" active", "");
    bt_his.className = bt_his.className.replace(" active", "");
    dep.style.display = "none";
    wit.style.display = "none";
    his.style.display = "none";

    if (identifiquier === "deposit") {
        bt_dep.className += " active";
        dep.style.display = "";
    } else if (identifiquier === "withdraw") {
        bt_wit.className += " active";
        wit.style.display = "";
    } else {
        bt_his.className += " active";
        his.style.display = "";
    }
}

function choseStakeDuration(btn) {
    var bt_15days = document.getElementById("btn_15days");
    var bt_30days = document.getElementById("btn_30days");
    var bt_60days = document.getElementById("btn_60days");
    var bt_90days = document.getElementById("btn_90days");

    bt_15days.className = bt_15days.className.replace(" active", "");
    bt_30days.className = bt_30days.className.replace(" active", "");
    bt_60days.className = bt_60days.className.replace(" active", "");
    bt_90days.className = bt_90days.className.replace(" active", "");

    switch (btn.id) {
        case "btn_15days":
            bt_15days.className += " active";
            break;
        case "btn_30days":
            bt_30days.className += " active";
            break;
        case "btn_60days":
            bt_60days.className += " active";
            break;
        case "btn_90days":
            bt_90days.className += " active";
            break;
    }
}

function changeViewMainPanel(btn) {
    var btn_staking = document.getElementById("btn_staking");
    var btn_packs = document.getElementById("btn_packs");
    var btn_roulette = document.getElementById("btn_roulette");
    btn_staking.className = btn_staking.className.replace(" active", "");
    btn_packs.className = btn_packs.className.replace(" active", "");
    btn_roulette.className = btn_roulette.className.replace(" active", "");

    var staking = document.getElementById("panel_staking");
    var packages = document.getElementById("panel_packages");
    staking.style.display = "none";
    packages.style.display = "none";

    switch (btn.id) {
        case "btn_staking":
            btn_staking.className += " active";
            staking.style.display = "";
            break;
        case "btn_packs":
            btn_packs.className += " active";
            packages.style.display = "";
            break;
        case "btn_roulette":
            btn_roulette.className += " active";
            break;

    }
}