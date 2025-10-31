//function reloadEmbed(id) {
//    document.getElementById(id).src += '';
//    console.log("Reloaded")
//}
function reloadEmbed(id) {
    const proxyIframe = document.getElementById(id);
    proxyIframe.src = proxyIframe.contentWindow.location.href;
}
