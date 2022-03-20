

class ComInfo {
    constructor(comId) {
        this.comId = comId;
        this.comConfig = {};
        this.comName = "";
        this.comTaxCode = "";
        await this.getComConfig();
        this.template = this.initTemplate();
    }

    async getComConfig() {

        /* Đọc trang 1 của Cấu hình */
        let tempPage = await this.getPage();
        let trSelector = tempPage.getElementsByClassName("table")[0].getElementsByTagName("tr");
        this.comConfig = { ...this.getConfigId(trSelector) };

        /* Lấy số trang trong trang 1 Cấu hình */
        let pageCheck = tempPage.getElementsByClassName('paginate_button');
        let pageLen = pageCheck.length - 2;

        /* Lấy tên Công ty trong trang 1 Cấu hình */
        this.comName = this.getComName(tempPage);

        /* Đọc trang 2+ của Cấu hình */
        for (let p = 2; p < 2 + pageLen - 1; p++) {
            tempPage = await this.getPage(p);
            trSelector = tempPage.getElementsByClassName("table")[0].getElementsByTagName("tr");
            this.comConfig = { ...this.comConfig, ...this.getConfigId(trSelector) };
        }

        /* Lấy MST từ PublishDomain */
        this.comTaxCode = this.getTaxCode();
    }

    /* Load HTMl của page 'index' Config */
    async getPage(index) {
        let url = '/Configs/Index/' + this.comId;
        if (index) {
            url += '?page=' + index;
        }
        let header = {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8; boundary=---------------------------" + Date.now().toString(16),
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "content-encoding": "gzip"
        };
        let response = await fetch(url, {
            header: header,
            method: "GET"
        });
        let html = await response.text();
        let tempdiv = document.createElement("div");
        tempdiv.innerHTML = html.substring(
            html.indexOf("<body"),
            html.indexOf("</body>") + 7
        );
        return tempdiv;
    }

    /* Lấy Id của từng row trong trang Config */
    getConfigId(trSelector) {
        let rowConfig = {};
        for (let i = 1; i < trSelector.length; i++) {
            let col = trSelector[i].getElementsByTagName("td");
            /* Cột 2: tên template, cột 4: nút Edit */
            if (col[1]) {
                let key = col[1].innerText.trim();
                let link = col[1].querySelector("a");
                if (link) {
                    let reg = /\\\/Configs\\\/Edit\\\/(\\\d+)/g;
                    let id = reg.exec(link)[1];
                    if (id) {
                        rowConfig[key] = {
                            id: id,
                            old: col[2].innerText.trim(),
                        }
                    }
                }
            }
        }
        return rowConfig;
    }

    /* Lấy tên công ty ở heading 1 của trang 1 Cấu hình */
    getComName(pageHTML) {
        try {
            let _comName = pageHTML.getElementsByClassName('content-header')[0].getElementsByTagName('h1')[0].innerText.replace("Danh sách cấu hình hệ thống thật của khách hàng ", "").replace("Danh sách cấu hình hệ thống test của khách hàng ", "").trim();
            return _comName;
        } catch (e) {
            console.log(e);
        }
        return null;
    }

    /* Lấy MST ở value của PublishDomain */
    getTaxCode() {
        let result;
        let str = this.comConfig['PublishDomain'].old;
        try {
            /* https://3502427224-002-democadmin.vnpt-invoice.com.vn */
            let reg = /https:\\\/\\\/([\\\d-]+)(demo|tt78)?cadmin/g;
            result = reg.exec(str)[1];
            if (result && result[result.length - 1] === '-') {
                result = result.substring(0, result.length - 1).trim();
            }
            if (result != "")
                return result;
        } catch (e) { console.log("Not Token", e) }
        try {
            /* https://bqlchohuyenlongdienadmin.vnpt-invoice.com.vn */
            let regHSM = /https:\\\/\\\/([a-z0-9]+)admin/g;
            result = regHSM.exec(str)[1];
            if (result != "")
                return result;
        } catch (e) { console.log("Not HSM", e) }
        return null;
    }

    /* Set Id cho các template, nếu ko có sẵn thì set 0 */
    setConfigId(templateName) {
        try {
            let id = this.comConfig[templateName].id;
            return id;
        } catch {
            return "0";
        }
    }

    /* Set Old Value cho template*/
    setConfigOld(templateName) {
        try {
            let old = this.comConfig[templateName].old;
            return old;
        } catch {
            return null;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /* Nội dung các template */
    initTemplate() {
        return {
            "MessagerMail": {
                /* 3 TokenChung */
                value: '[subject]Hóa đơn điện tử mua hàng hóa, dịch vụ tại ' + this.comName + '[/subject][body]<p>Kính gửi:<b>$NameCustomer</b></p><p>Mã số thuế: $CusTaxCode</p><p>Đơn vị $company vừa $type hóa đơn điện tử $InvMonth của Quý khách hàng. Thông tin hóa đơn như sau:</p><ul><li>Mẫu số hóa đơn: $pattern</li><li>Ký hiệu hóa đơn: $serial</li><li>Số hóa đơn: $invNumber</li><li>Mã tra cứu: $fkey</li></ul><p>Quý khách vui lòng bấm vào <a href="$invoiceUrl"><span> "Đây"</span></a> để lấy hóa đơn hoặc Đăng nhập vào website: https://' + this.comTaxCode + '.vnpt-invoice.com.vn, nhập mã tra cứu: $fkey</p><p>Để tải hóa đơn dạng PDF: Nhấp chuột tại <a href="$pdfUrl"><span> "Đây"</span></a></p><p>Để tải hóa đơn dạng XML: Nhấp chuột tại <a href="$fileUrl"><span> "Đây"</span></a></p><p>VNPT-Vinaphone xin trân trọng cảm ơn Quý khách hàng đã tin tưởng sử dụng và hợp tác với giải pháp hóa đơn điện tử VNPT-Invoice. Mọi vướng mắc về phần mềm vui lòng liên hệ với chúng tôi : VNPT Bà Rịa - Vũng Tàu - Chi nhánh Tổng công ty Dịch vụ viễn thông VNPT-Vinaphone (0254800126 - 02543819818) để được giải quyết nhanh nhất.</p><p><b style="color: #FF0000;">Chú ý: Đây là mail tự động từ hệ thống. Vui lòng không reply!<b></p><p>Trân trọng ./.</p>[/body]'
            },
            "SendAdjust": {
                /* 14 SendAdjust */
                value: "1"
            },
            "SendReplace": {
                /* 15 SendReplace */
                value: "1"
            },
            "SendCancel": {
                /* 16 SendCancel */
                value: "1"
            },
            "MessagerCancel": {
                /* 17 MessagerCancel */
                value: '[subject] ' + this.comName + ' - Thông báo về việc hủy hóa đơn[/subject][body]Kính gửi Quý khách hàng,<br/>$CompanyName vừa hủy hóa đơn của Quý khách hàng.<br/>Hóa đơn hủy số: $invNumber thuộc mẫu: $pattern và ký hiệu $serial<br/>Quý Khách lưu ý, đây là email phản hồi tự động vui lòng không trả lời email này.<br/>Trân trọng ./.[/body]'
            },
            "SendEmailAdjustReplace": {
                /* 18 SendEmailAdjustReplace */
                value: "1"
            },
            "MessagerReplace": {
                /* 19 TokenChung */
                value: '[subject]Hóa đơn điện tử mua hàng hóa, dịch vụ tại ' + this.comName + '[/subject][body]Kính gửi: Quý khách hàng,<br/>Cảm ơn Quý khách đã mua hàng hóa, sử dụng dịch vụ của $CompanyName.<br/>Hóa đơn điện tử mua hàng hóa, dịch vụ của Quý khách đã được phát hành với các thông tin như sau: <ul> <li>Mẫu số: $Newpattern</li> <li>Ký hiệu hóa đơn: $NewSerial</li> <li>Số hóa đơn: $NewInvMumber</li> <li>Trạng thái: Đã thay thế cho hóa đơn số $invNumber</li><li>Tra cứu hóa đơn tại đường link: https://' + this.comTaxCode + '.vnpt-invoice.com.vn – nhập mã tra cứu: $NewFkey</li></ul>Ghi chú: Hóa đơn điện tử có giá trị pháp lý tương đương với hóa đơn giấy.<br/>Đây là Email tự động, Quý khách vui lòng không trả lời lại Email này.<br/>Giải pháp Hóa đơn điện tử được cung cấp bởi VNPT, Quý khách có nhu cầu sử dụng hóa đơn điện tử cho công ty mình, vui lòng liên hệ Hotline: 18001260.[/body]'
            },
            "MessagerAdjust": {
                /* 20 TokenChung */
                value: '[subject]Hóa đơn điện tử mua hàng hóa, dịch vụ tại ' + this.comName + '[/subject][body] Kính gửi: Quý khách hàng,<br/>Cảm ơn Quý khách đã mua hàng hóa, sử dụng dịch vụ của $CompanyName.<br/>Hóa đơn điện tử mua hàng hóa, dịch vụ của Quý khách đã được phát hành với các thông tin như sau:<ul><li>Mẫu số: $Newpattern</li><li>Ký hiệu hóa đơn: $NewSerial</li><li>Số hóa đơn: $NewInvMumber</li><li>Trạng thái: Đã điều chỉnh cho hóa đơn số $invNumber</li><li>Tra cứu hóa đơn tại đường link: https://' + this.comTaxCode + '.vnpt-invoice.com.vn – nhập mã tra cứu: $NewFkey</li></ul>Ghi chú: Hóa đơn điện tử có giá trị pháp lý tương đương với hóa đơn giấy.<br/>Đây là Email tự động, Quý khách vui lòng không trả lời lại Email này.<br/>Giải pháp Hóa đơn điện tử được cung cấp bởi VNPT, Quý khách có nhu cầu sử dụng hóa đơn điện tử cho công ty mình, vui lòng liên hệ Hotline: 18001260.[/body]'
            },
            "ConfigViewHAIINVVAT": {
                /* 24 ConfigViewHAIINVVAT VATRate+BehindComma*/
                value: '{"VATRate":"-2=Không kê khai và nộp thuế;-1=Không thuế GTGT;0=0%;5=5%;8=8%;10=10%","BehindComma":"ProdQuantity=2;ProdPrice=2"}',
                old: setConfigOld("ConfigViewHAIINVVAT")
            },
            "BehindComma": {
                /* 25 BehindComma: ProdQuantity=2;ProdPrice=2*/
                value: 'ProdQuantity=2;ProdPrice=2',
                old: setConfigOld("BehindComma")
            },
            "VATRateView": {
                /* 26 VATRateView: 0=0;2=2;5=5;8=8;10=10;-1=Không thuế GTGT*/
                value: '0=0;2=2;5=5;8=8;10=10;-2=Không kê khai và nộp thuế;-1=Không thuế GTGT'
            },
            "ConfigViewHAIINVVATTT78": {
                /* 28 ConfigViewHAIINVVATTT78*/
                value: '{"BehindComma":"ProdQuantity=3;ProdPrice=5;ProdTotal=2;Total=2;VATAmount=2;Amount=0;ProdQuantityUSD=3;ProdPriceUSD=2","VATRate":"-2=Không kê khai và nộp thuế;-1=Không thuế GTGT;0=0%;5=5%;8=8%;10=10%","PaymentMethod":"KTT=Không thu tiền;TM=Thanh toán tiền mặt;CK=Thanh toán chuyển khoản;TTD=Thanh toán thẻ tín dụng;HDDT=Hình thức HDDT;TM/CK=Hình thức thanh toán tiền mặt hoặc chuyển khoản;BT=Thanh toán bù trừ","CurrencyUnit":"VND=Hoá đơn Việt Nam đồng;USD=Hoá đơn Đô-la Mỹ;EUR=Hóa đơn EURO"}',
                old: setConfigOld("ConfigViewHAIINVVATTT78")
            }
        };
    }


    /* Post data của 1 template gồm {comId, templateId, templateName, templateValue} */
    sendData(template) {
        let xhttp = new XMLHttpRequest();
        /* Nếu id=0 thì tạo mới, ngược lại thì Edit */
        let templateId = this.comConfig[template.name].id || "0";
        var requestUrl = templateId === "0" ?
            "/Configs/Create/" + this.comId :
            "/Configs/Edit/";
        xhttp.open("POST", requestUrl, true);
        xhttp.setRequestHeader(
            "Content-Type",
            "application/x-www-form-urlencoded; charset=UTF-8"
        );
        let query =
            "customerId=" +
            this.comId +
            "&identification=" +
            templateId +
            "&key=" +
            template.name +
            "&value=" +
            encodeURIComponent(template.value);
        xhttp.send(query);
    }
}


function isJSON(configOld) {
    if (configOld[0] === '{' && configOld[configOld.length - 1] === '}') {
        return true;
    }
    else {
        return false;
    }
}

/* Merge 2 string JSON với nhau, overwrite=false: giữ value cũ nếu trùng key */
function JSONMerge(str1, str2, overwrite = false) {
    str1 = str1.replace(/'/g, '"');
    str2 = str2.replace(/'/g, '"');
    let json1 = JSON.parse(str1);
    let json2 = JSON.parse(str2);
    let result = json1;
    for (let key in json2) {
        if (!result[key] || overwrite == true) {
            result[key] = json2[key];
        }
    }
    return JSON.stringify(result);
}

/* Lần lượt post data cho tất cả các template & reload page */
async function processPreset(comInfo) {
    for (let i = 0; i < PRESET.length; i++) {
        await wait(600);
        let configOld = comInfo.template[PRESET[i]].old;
        let configNew = comInfo.template[PRESET[i]].value;
        if (configOld && (configNew !== configOld)) {
            if (configOld[0] === '{' && configOld[configOld.length - 1] === '}') {
                comInfo.template[PRESET[i]].value = JSONMerge(configOld, configNew);
            }
            else {
                continue;
            }
        }
        sendData(comInfo.template[PRESET[i]]);
    }
}


























function getTaxCodeInPage() {
    try {
        let selector = document.querySelector(
            ".panel-body table tr:nth-child(2) td:nth-child(3)"
        );
        if (selector) {
            return selector.innerText;
        }
    } catch (e) { }
    return "";
}
async function main() {
    let askTaxcode = prompt("Paste yêu cầu Jira hoặc MST", getTaxCodeInPage());
    if (askTaxcode) {
        creatOverlay();
        /* Lấy MST bằng REGEX */
        let taxCode = getTaxCodeFromString(askTaxcode);
        if (taxCode.length > 0) {
            updateOverlayLog("Tìm thấy các MST: " + taxCode.toString());
            for (let i = 0; i < taxCode.length; i++) {
                await wait(500);
                await processCom(taxCode[i]);
            }
        } else {
            updateOverlayLog("<span style='color: #f00'>Không đọc được MST</span>");
        }
        updateOverlayStatus("Hoàn tất", false);
    }
}

async function processCom(taxCode) {
    updateOverlayStatus("Đang chạy");
    updateOverlayLog("Tìm công ty theo MST: [" + taxCode + "]...");

    /* Lấy Thông tin công ty [Tên, ComId] */
    let comInfo = await getComInfo(taxCode);
    if (comInfo && comInfo.comId && comInfo.comName) {
        comInfo.taxCode = taxCode;
        updateOverlayLog("Tên công ty: " + comInfo.comName);
        updateOverlayLog(
            "Mã công ty: [" + comInfo.comId + "]",
            "Chuẩn bị khởi tạo <a href='https://quantridichvu-hddt.vnpt-invoice.com.vn/Initialization/CustomersReal?keyword=" +
            comInfo.taxCode +
            "&areaId=0&sysType=0&statustype=34&initType=0' style='color: #d00; text-decoration: underline;'>[Click để hủy]</a>"
        );
    } else {
        updateOverlayLog("<span style='color: #f00'>Không tìm thấy công ty</span>");
        return false;
    }
    await requestTemplateList(comInfo);
}
async function requestTemplateList(comInfo) {
    let urlTemplateList = "/RegisterTemp/GetReg";
    let header = {
        "content-type": "ajax/json"
    };
    /* https://quantridichvu-hddt.vnpt-invoice.com.vn/RegisterTemp/Edit/276ed4d5-01a6-4c61-a3ec-ae51010acd66?IdCus=0231f303-a315-41cb-96de-ae2a00b11ceb */
    let responseTemplateList = await fetch(urlTemplateList, {
        header: header,
        body: { id: comInfo.comId },
        method: "POST"
    });
    let dataTemplateList = await responseTemplateList.text();
    console.log("dataTemplateList:", dataTemplateList);
}

async function checkContract(comInfo) {
    let urlDetail = "/Initialization/CustomerDetail/" + comInfo.comId;
    let responseDetail = await fetchCom(urlDetail);
    let dataDetail = await responseDetail.text();
    if (
        dataDetail.indexOf("Tên hợp đồng:") > 0 &&
        dataDetail.indexOf('title="Khởi tạo thật"') > 0
    ) {
        return true;
    }
    return false;
}
async function requestDeploy(comInfo) {
    let urlDeploy = "/Initialization/Init/" + comInfo.comId;
    let urlInfo = "/Initialization/CustomerDetail/" + comInfo.comId;
    let responseDeploy = await fetchCom(urlDeploy);
    console.log("responseDeploy.status:" + responseDeploy.status);

    if (responseDeploy.status === 200) {
        let infoPage = await fetchCom(urlInfo);
        let dataDeploy = await infoPage.text();
        console.log("infoPage.status:" + infoPage.status);

        if (dataDeploy.indexOf("Tạo domain thật") > 0) {
            return true;
        }
    }
    return false;
}
async function requestDomain(comInfo) {
    let urlDomain = "/Initialization/InitDomain/" + comInfo.comId;
    let responseDomain = await fetchCom(urlDomain);
    console.log("responseDomain.status:", responseDomain.status);
    if (responseDomain.status === 200) {
        return true;
    }
    return false;
}

function getTaxCodeFromString(str) {
    let result = [];
    try {
        let regex = /(\\\d{10}(?:-\\\d{3}){0,1})/gm;
        let found;
        while ((found = regex.exec(str)) !== null) {
            if (found.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            if (found[0]) {
                result.push(found[0]);
            }
        }
    } catch (e) { }
    return [...new Set(result)];
}
async function getComInfo(mst) {
    try {
        let url =
            "/Initialization/CustomersTest?keyword=" +
            mst +
            "&areaId=0&sysType=0&statustype=12";
        /* Tạo boundary khi upload dạng Form */
        var sBoundary = "---------------------------" + Date.now().toString(16);
        let header = {
            "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8; boundary=" + sBoundary,
            accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "content-encoding": "gzip"
        };
        let response = await fetch(url, {
            header: header,
            method: "GET"
        });
        let data = await response.text();
        let regex = /"\\\/Initialization\\\/CustomerEdit\\\/(\\\S+)"/g;
        let comId = regex.exec(data)[1];
        let regex2 = /title="Thay đổi">(.+?)<\\\/a>/g;
        let comName = htmlDecode(regex2.exec(data)[1]);
        return {
            comId: comId,
            comName: comName
        };
    } catch (e) {
        console.log(e);
        return null;
    }
}
async function addContract(comInfo) {
    let today = new Date().toLocaleDateString("en-gb");
    const contract = {
        Taxcode: comInfo.taxCode,
        Identification: comInfo.comId,
        "lstContract[0]._ContractName": comInfo.comName,
        "lstContract[0].No": "",
        "lstContract[0].Quantity": comInfo.qty,
        "lstContract[0].ContractDate": today,
        "lstContract[0].ContractType": "989d79d3-e93e-4b3d-94ac-a93500ae1890"
    };
    const url = "/Initialization/AddContract";
    /* Tạo boundary khi upload dạng Form */
    var sBoundary = "---------------------------" + Date.now().toString(16);
    let header = {
        "content-type":
            "application/x-www-form-urlencoded; charset=UTF-8; boundary=" + sBoundary,
        accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "content-encoding": "gzip"
    };

    let form_data = objectToFormData(contract);
    let response = await fetch(url, {
        header: header,
        body: form_data,
        method: "POST"
    });
    return response;
}

async function fetchCom(url) {
    let header = {
        "content-type":
            "application/x-www-form-urlencoded; charset=UTF-8; boundary=---------------------------" +
            Date.now().toString(16),
        accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "content-encoding": "gzip"
    };
    try {
        let response = await fetch(url, {
            header: header,
            method: "GET"
        });
        if (response.status === 200) {
            return response;
        }
    } catch (e) {
        console.log(e);
    }
    return null;
}

/* convert JSON object to  FormData */
function objectToFormData(obj, rootName, ignoreList) {
    var formData = new FormData();
    function appendFormData(data, root) {
        if (!ignore(root)) {
            root = root || "";
            if (data instanceof File) {
                formData.append(root, data);
            } else if (Array.isArray(data)) {
                for (let data_i = 0; data_i < data.length; data_i++) {
                    appendFormData(data[data_i], root + "[" + data_i + "]");
                }
            } else if (typeof data === "object" && data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (root === "") {
                            appendFormData(data[key], key);
                        } else {
                            appendFormData(data[key], root + "." + key);
                        }
                    }
                }
            } else {
                if (data !== null && typeof data !== "undefined") {
                    formData.append(root, data);
                }
            }
        }
    }
    function ignore(root) {
        return (
            Array.isArray(ignoreList) &&
            ignoreList.some(function (x) {
                return x === root;
            })
        );
    }
    appendFormData(obj, rootName);
    return formData;
}
function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}
let wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function newElement(tag, isBlock, { ...attArray }) {
    let newElement = document.createElement(tag);
    let style = Object.keys(attArray);
    for (let i = 0; i < style.length; i++) {
        newElement[style[i]] = attArray[style[i]];
    }
    /* Wrap in new div if isBlock = true */
    if (isBlock) {
        let newBlock = document.createElement("div");
        newBlock.appendChild(newElement);
        return newBlock;
    }
    return newElement;
}
function creatOverlay() {
    /* CSS for popup classes */
    let style = newElement("style", false, {
        innerHTML:
            "#_ext_overlay { height: 100%; width: 100%; position: fixed; z-index: 9999; left: 0; top: 0; background-color: rgba(0,0,0, 0.5); overflow-x: hidden;}" +
            "#_ext_overlay_content { position: relative;  top: 10%; width: 100%; text-align: center; margin-top: 30px;}" +
            "#_ext_overlay_content p{ padding: 8px; text-decoration: none; font-size: 36px; color: #fff; display: block;}" +
            "#_ext_overlay_content p.loading:after{ content: ' .'; animation: dots 1s steps(5, end) infinite;}" +
            "@keyframes dots {" +
            "0%, 20% {color: rgba(0,0,0,0);text-shadow: .25em 0 0 rgba(0,0,0,0),  .5em 0 0 rgba(0,0,0,0);}" +
            "40% {color: white; text-shadow:.25em 0 0 rgba(0,0,0,0),   .5em 0 0 rgba(0,0,0,0);}" +
            "60% {text-shadow: .25em 0 0 white, .5em 0 0 rgba(0,0,0,0);}" +
            "80%, 100% {text-shadow: .25em 0 0 white, .5em 0 0 white;}}",
        type: "text/css"
    });
    let overlay = newElement("div", false, {
        id: "_ext_overlay"
    });
    overlay.appendChild(style);
    let overlay_content = newElement("div", false, {
        id: "_ext_overlay_content",
        innerHTML:
            '<p class="loading" id="_ext_overlay_loading">Đang chạy</p><p id="_ext_overlay_log"></p>'
    });
    overlay.appendChild(overlay_content);
    document.body.appendChild(overlay);
}
function updateOverlayLog(text) {
    document.getElementById("_ext_overlay_log").innerHTML += "<br />" + text;
}
function updateOverlayStatus(status, loading = true) {
    let loadingDiv = document.getElementById("_ext_overlay_loading");
    if (!loading) {
        loadingDiv.classList.remove("loading");
    } else {
        loadingDiv.classList.add("loading");
    }
    loadingDiv.innerHTML = status;
}

/* Dùng để lấy toàn bộ danh sách công ty */
async function mergeRows() {
    let site = {
        pageLink: "/Initialization/CustomersReal?areaId=15&statustype=34&sysType=0&initType=0&page=",
        pageLast: ".paginate_button:nth-last-child(2) a",
        row: ".panel-body .table tr",
        outputBlock: ".panel-body .table tbody"
    };
    try {
        let pages = document.querySelector(site.pageLast).innerText;
        if (!pages) {
            return false;
        }
        console.log("pages::", pages);
        let outputBlock = document.querySelector(site.outputBlock);
        if (!outputBlock) {
            return false;
        }
        for (let i = 2; i <= parseInt(pages); i++) {
            let href = site.pageLink + i;
            let response = await getRawHtml(href);

            let tempdiv = document.createElement("div");
            tempdiv.innerHTML = response.substring(
                response.indexOf("<body"),
                response.indexOf("</body>") + 7
            );

            let rows = tempdiv.querySelectorAll(site.row);
            if (!rows) {
                continue;
            }
            console.log("rows::", rows);
            for (let j = 1; j < rows.length; j++) {
                outputBlock.appendChild(rows[j]);
            }
        }
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}
async function getRawHtml(url) {
    console.log("getRawHtml::start", url);
    let header = {
        "content-type":
            "application/x-www-form-urlencoded; charset=UTF-8; boundary=---------------------------" +
            Date.now().toString(16),
        accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "content-encoding": "gzip"
    };

    let response = await fetch(url, {
        header: header,
        method: "GET"
    });
    let data = await response.text();
    console.log("getRawHtml::end", response.status);
    return data;
}

if (document.URL.indexOf("quantridichvu-hddt.vnpt-invoice.com.vn") > 0) {

} else if (
    document.URL.indexOf("cdpn.io") < 0 &&
    document.URL.indexOf("vscode") < 0
) {
    window.open(
        "https://quantridichvu-hddt.vnpt-invoice.com.vn/Initialization/CustomersTest?keyword=&areaId=0&sysType=0&statustype=12"
    );
}
