<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Index.aspx.cs" Inherits="owen.demo.webupload.Index" %>

<!DOCTYPE html>

<html>
<head runat="server">
    <title></title>
    <link href="webupload/webuploader.css" rel="stylesheet" />

    <script src="javascript/jquery-1.8.3.min.js"></script>
    <script src="webupload/webuploader.min.js"></script>
    <script src="javascript/jsUpload.js"></script>

    <script type="text/javascript">

        function absolutePathPrefix() {
            var protocol = window.location.protocol,
                host = window.location.host,
                appPath = '<%= Page.Request.ApplicationPath %>',
                rtnPath = "";

                appPath = appPath == '/' ? appPath : appPath + '/';
                rtnPath = protocol + '//' + host + appPath;
                return rtnPath;
            }


            $(document).ready(function () {
                $("#myuploader").infoshareUpload({
                    containerWidth: '90%', //auto or xxxpx or 100%
                    containerHight: '500px', //auto or xxxpx
                    swf: '<%=ResolveClientUrl("~/webuploader/Uploader.swf") %>',
                    server: absolutePathPrefix() + 'services/uploadHandler.ashx?rnd=' + Math.random(),
                    hostUrl: absolutePathPrefix(),
                    params: {
                        //"woid": CurrentWorkOrderID,
                        //"folderName": $("#folderName").val()
                    },
                    finishEvent: undefined,//'finishJsFun()' callback
                    columns: {
                        "File Name": "37%",
                        "File Size": "10%",
                        "Progress": "32%", //(0px || 0% || 0 px || 0.00%) hidden
                        "Status": "15%",
                        "Handle": "6%"
                    },
                    dragable: true,
                    showFooter: true, //whether show file-count  file total-size info etc.
                    paste: document.body, //default undefined
                    fileSizeLimit: 1024 * 1024 * 1024, //1G
                    fileSingleSizeLimit: 1024 * 1024 * 2048, //2G default:undefined  
                    fileNumLimit: 20, //
                    prepareNextFile: false,
                    chunked: true, // true is good for big file.
                    chunkSize: 1024 * 1024 * 3, //3M 
                    chunkRetry: 2,
                    threads: 3,
                    accept: {
                        title: '', //description
                        extensions: 'DOC,DOCX,XLS,XLSX,PPT,PPTX,XPS,PDF,WPD,TXT,MP3,WMA,WAV,MOV,WMV,MP4,ASX,FLV,JPG,JPEG,BMP,GIF,PNG,TIF,TIFF,RAR,ZIP', //for flash html5
                        mimeTypes: [/* just for html5 filter*/
                                        'application/msword',
                                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',//docx
                                        'application/vnd.ms-powerpoint',    // ppt pps pot ppa
                                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',    // pptx
                                        'application/x-xls',//xls
                                        'image/*',
                                        'video/*',
                                        'application/pdf',
                                        'application/x-rar-compressed',//rar
                                        'application/zip',//zip
                                        'text/plain',
                        ].join(',')
                    },
                    resize: false
                });
            });

            function uploadCallBack() {
                alert('this is upload complete js function');
            }

            function isReadyToUpload() {
                var rtnObj = {
                    isReady: "1",
                    msg: ""
                }
                // todo.
                return rtnObj;
            }
    </script>
</head>
<body>
    <div id="myuploader" style="margin-top: 5px; margin-left: 5px">
    </div>
</body>
</html>