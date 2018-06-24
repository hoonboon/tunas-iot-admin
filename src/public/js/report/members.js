$(document).ready(function () {
  
});

function resetForm() {
  $("#dateJoinFrom").val($("#dateJoinFromDefault").val());
  $("#dateJoinTo").val($("#dateJoinToDefault").val());
}

function onDownload(rowId) {
  $("#btnDownload").attr("disabled", "disabled");
  let params = "dateJoinFrom=" + $("#dateJoinFrom").val()
    + "&dateJoinTo=" + $("#dateJoinTo").val();
  window.open("/report/members/download?" + params, "report");
  $("#btnDownload").removeAttr("disabled");
}