class ComInfo {
    constructor(comId) {
        this.comId = comId;
        this.comConfig = {};
        this.comName = "";
        this.comTaxCode = "";
        return (async () => {
            await this.getComConfig();
            this.template = this.initTemplate();
            return this;
        })();

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
            let reg = /https:\\\/\\\/([\\\d-]+)(demo|tt78|tt78demo)?cadmin/g;
            result = reg.exec(str)[1];
            if (result && result[result.length - 1] === '-') {
                result = result.substring(0, result.length - 1).trim();
            }
            if (result != "")
                return result;
        } catch (e) { console.log("Not Token", e) }
        try {
            /* https://bqlchohuyenlongdienadmin.vnpt-invoice.com.vn */
            let regHSM = /https:\\\/\\\/([a-z0-9]+)(-tt78)?admin/g;
            result = regHSM.exec(str)[1];
            if (result != "")
                return result;
        } catch (e) { console.log("Not HSM", e) }
        return null;
    }

    /* Nội dung các template */
    initTemplate() {
        try{
            let template = {
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
                    value: '{"VATRate":"-2=Không kê khai và nộp thuế;-1=Không thuế GTGT;0=0%;5=5%;8=8%;10=10%","BehindComma":"ProdQuantity=2;ProdPrice=2"}'
                },
                "BehindComma": {
                    /* 25 BehindComma: ProdQuantity=2;ProdPrice=2*/
                    value: 'ProdQuantity=2;ProdPrice=2',
                    keep: true
                },
                "VATRateView": {
                    /* 26 VATRateView: 0=0;2=2;5=5;8=8;10=10;-1=Không thuế GTGT*/
                    value: '0=0;2=2;5=5;8=8;10=10;-2=Không kê khai và nộp thuế;-1=Không thuế GTGT'
                },
                "ConfigViewHAIINVVATTT78": {
                    /* 28 ConfigViewHAIINVVATTT78*/
                    value: '{"BehindComma":"ProdQuantity=3;ProdPrice=5;ProdTotal=2;Total=2;VATAmount=2;Amount=0;ProdQuantityUSD=3;ProdPriceUSD=2","VATRate":"-2=Không kê khai và nộp thuế;-1=Không thuế GTGT;0=0%;5=5%;8=8%;10=10%","PaymentMethod":"KTT=Không thu tiền;TM=Thanh toán tiền mặt;CK=Thanh toán chuyển khoản;TTD=Thanh toán thẻ tín dụng;HDDT=Hình thức HDDT;TM/CK=Hình thức thanh toán tiền mặt hoặc chuyển khoản;BT=Thanh toán bù trừ","CurrencyUnit":"VND=Hoá đơn Việt Nam đồng;USD=Hoá đơn Đô-la Mỹ;EUR=Hóa đơn EURO"}'
                }
            };
            for (let key in template) {
                if (this.comConfig[key]) {
                    template[key].id = this.comConfig[key].id || "0";
                    let configOld = this.comConfig[key].old;
                    if (configOld) {
                        if (configOld[0] === '{' && configOld[configOld.length - 1] === '}') {
                            let _jsonmerge = JSONMerge(configOld, template[key].value);
                            if (_jsonmerge){
                                template[key].value = _jsonmerge;
                            }
                            else{
                                return null;
                            }                            
                        }
                        else if (template[key].keep) {
                            delete template[key];
                        }
                    }
                }
                else {
                    template[key].id = "0";
                }
            };
            return template;
        }
        catch(e){
            console.log("initTemplate::", e);
        }
        return null;
    }


    /* Post data của 1 template gồm {this.comId, template.id, templateName, template.value} */
    async sendData(templateName) {
        let template = this.template[templateName];
        if (template) {
            /* Nếu id=0 thì tạo mới, ngược lại thì Edit */
            var requestUrl = template.id === "0" ?
                "/Configs/Create/" + this.comId :
                "/Configs/Edit/";

            let header = {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8;"
            };
            let json = {
                customerId: this.comId,
                identification: template.id,
                key: templateName,
                value: template.value
            };
            let form_data = objectToFormData(json);
            let response = await fetch(requestUrl, {
                header: header,
                body: form_data,
                method: "POST"
            });

            if (response.status === 200){
                return true;
            };            
        }
        return false;
    }
}


/**
 * Creat Popup
 */
function creatPopup() {
    /* CSS for popup classes */
    let style = newElement("style", false, {
        innerHTML:
            "#_ext_close{padding: 5px 7px !important; font-size: 10px !important; position:absolute !important; right:0 !important; top:0 !important; margin-bottom: 5px !important;background: #ddd !important; border: 1px solid #ddd !important; cursor: pointer}" +
            "._ext_link{margin-bottom: 5px !important; padding: 3px 5px !important; color: #000;}" +
            "._ext_button{width: 120px; height: 36px; background: #0a6b34; border: none; border-radius: 2px; color: #fff; float: left; margin-right: 20px}" +
            "._ext_button:hover{background: #119149; cursor: pointer}" +
            "#_ext_popup{position:fixed; z-index: 99999; top:40px; left: 0; background: #fff; padding: 30px 15px 10px; min-width: 200px; min-height: 140px; box-shadow: 5px 5px 10px rgba(13,128,101,0.33);}",
        type: "text/css"
    });

    let popup = newElement("div", false, {
        id: "_ext_popup"
    });
    popup.appendChild(style);

    let close = newElement("button", false, {
        id: "_ext_close",
        innerText: "<<"
    });
    close.addEventListener("click", function () {
        let closeSelector = document.getElementById("_ext_close");
        if (closeSelector.innerText === "<<") {
            closeSelector.innerText = ">>";
            closeSelector.style.setProperty("right", "-25px", "important");
            document.getElementById("_ext_popup").style.left = "-230px";
        } else {
            closeSelector.innerText = "<<";
            closeSelector.style.setProperty("right", "0", "important");
            document.getElementById("_ext_popup").style.left = "";
        }
    });
    popup.appendChild(close);

    let txtInput = newElement("textarea", true, {
        style: "margin-bottom: 4px; overflow: auto; width: 400px; height: 250px;",
        id: "_ext_txtInput",
        className: "_ext_textarea"
    });
    popup.appendChild(txtInput);

    let boxButton = newElement("div", false, {
        style: "margin-bottom: 4px; overflow: auto;"
    });
    let btnProcess = newElement("button", true, {
        id: "_ext_btnProcess",
        className: "_ext_button",
        innerText: "Run now"
    });
    btnProcess.addEventListener("click", async function () {
        await process();
    });
    boxButton.appendChild(btnProcess);
    popup.appendChild(boxButton);

    let txtOutput = newElement("textarea", true, {
        style: "margin-bottom: 4px; overflow: auto; width: 400px; height: 150px;",
        id: "_ext_txtOutput",
        className: "_ext_textarea"
    });
    popup.appendChild(txtOutput);

    document.body.appendChild(popup);
}

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

/* Merge 2 string JSON với nhau, overwrite=false: giữ value cũ nếu trùng key */
function JSONMerge(str1, str2, overwrite = false) {
    let tempStr;
    let json1, json2;
    try {
        json1 = JSON.parse(str1);        
    }
    catch(e){};
    if (!json1){
        try{
            tempStr = str1;
            tempStr = tempStr.replace(/'/g, '"');
            json1 = JSON.parse(tempStr); 
        }
        catch(e){
            console.log("JSONMerge::json1::", e);
        };
    };
    if (!json1){
        try{
            tempStr = str1;
            tempStr = tempStr.replace(/"/g, 'Δ');
            tempStr = tempStr.replace(/'/g, '"');
            tempStr = tempStr.replace(/Δ/g, "'");
            json1 = JSON.parse(tempStr); 
        }
        catch(e){
            console.log("JSONMerge::json1::", e);
        };
    };
    try {
        json2 = JSON.parse(str2);        
    }
    catch(e){};
    if (!json2){
        try{
            tempStr = str2;
            tempStr = tempStr.replace(/'/g, '"');
            json2 = JSON.parse(tempStr); 
        }
        catch(e){
            console.log("JSONMerge::json2::", e);
        };
    };
    if (!json2){
        try{
            tempStr = str2;
            tempStr = tempStr.replace(/"/g, 'Δ');
            tempStr = tempStr.replace(/'/g, '"');
            tempStr = tempStr.replace(/Δ/g, "'");
            json2 = JSON.parse(tempStr); 
        }
        catch(e){
            console.log("JSONMerge::json2::", e);
        };
    };
    try{
        let result = json1;
        for (let key in json2) {
            if (!result[key] || overwrite == true) {
                result[key] = json2[key];
            }
        }
        return JSON.stringify(result);
    }
    catch(e){
        console.log("JSONMerge::merge::", e);
    }
    return null;
}

async function process() {
    let ComArr = document.getElementById('_ext_txtInput').value.split(String.fromCharCode(10));
    for (let i = 0; i < ComArr.length; i++) {
        let comInfo = await new ComInfo(ComArr[i]);
        document.getElementById("_ext_txtOutput").value += comInfo.comId + String.fromCharCode(9) + comInfo.comName + String.fromCharCode(9) + comInfo.comTaxCode + String.fromCharCode(9);
        console.log(comInfo);
        if (comInfo.comId && comInfo.comName && comInfo.comTaxCode && comInfo.template) {
            let success = "OK";
            for (let templateName in comInfo.template) {
                let status = await comInfo.sendData(templateName);
                if (status === false){
                    success = "FAILED::" + templateName;
                    break;
                }
            }
            document.getElementById("_ext_txtOutput").value += success + String.fromCharCode(10);
        }
        else {
            document.getElementById("_ext_txtOutput").value += "FAILED::ComInfo" + String.fromCharCode(10);
        }
    }

}

if (document.URL.indexOf("quantridichvu-hddt.vnpt-invoice.com.vn") > 0) {
    creatPopup();
} else if (
    document.URL.indexOf("cdpn.io") < 0 &&
    document.URL.indexOf("vscode") < 0
) {
    window.open(
        "https://quantridichvu-hddt.vnpt-invoice.com.vn/Initialization/CustomersTest?keyword=&areaId=0&sysType=0&statustype=12"
    );
}