$(document).ready(function() {

});

function onSend(rowId: string) {
    $("#btnSend_" + rowId).attr("disabled", "disabled");
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
        }
    })
    .fail(function(xhr, status, error) {
        alert("Error: " + xhr.responseJSON.errorMsg);
    })
    .always(function() {
        $("#btnSend_" + rowId).removeAttr("disabled");
    });
}

function onResend(rowId: string) {
    if (confirm("Confirm to Resend?")) {
        onSend(rowId);
    }
}

function showMemberInfo(memberId: string) {
    alert("TODO: ");
}
