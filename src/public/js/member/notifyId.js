$(document).ready(function() {

});

function onSend(rowId) {
    $("#btnSend_" + rowId).attr("disabled", "disabled");

    const prevValue = $("#lastNotify_" + rowId).html();
    $("#lastNotify_" + rowId).html('<i class="fa fa-gear fa-spin" style="font-size:24px"></i>');

    $.post("/member/" + rowId + "/notifyId", {}, function(data, status) {
        if (status == "success") {
            $("#lastNotify_" + rowId).html(data.lastNotifyId);

            if ( $("#btnSend_" + rowId).text() == "Send") {
                $("#btnSend_" + rowId).removeClass("btn-success");
                $("#btnSend_" + rowId).addClass("btn-danger");
                $("#btnSend_" + rowId).text("Resend");
                $("#btnSend_" + rowId).attr("onclick", "onResend('" + rowId + "')");
            }
        } else {
            alert("Error: " + data.errorMsg);
            $("#lastNotify_" + rowId).html(prevValue);
        }
    })
    .fail(function(xhr, status, error) {
        alert("Error: " + xhr.responseJSON.errorMsg);
        $("#lastNotify_" + rowId).html(prevValue);
    })
    .always(function() {
        $("#btnSend_" + rowId).removeAttr("disabled");
    });
}

function onResend(rowId) {
    if (confirm("Confirm to Resend?")) {
        onSend(rowId);
    }
}

function submitViewList() {
    $("#searchForm").submit();
}

// function showMemberInfo(memberId: string) {
//     $("#member-info").modal("show");
// }
