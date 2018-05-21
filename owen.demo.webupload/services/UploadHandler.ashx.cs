using System;
using System.IO;
using System.Web;

namespace owen.demo.webupload.services
{
    /// <summary>
    /// Summary description for UploadHandler
    /// </summary>
    public class UploadHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";

            string action = string.Empty;
            string json = string.Empty;
            if (null != context.Request["action"] && "" != context.Request["action"].ToString())
            {
                action = context.Request["action"];
                switch (action.ToLower())
                {
                    case "upload":
                        json = uploadfile(context);
                        break;
                    case "mergefile":
                        json = MergeTempFiles(context);
                        break;
                    case "deltempfile":
                        DelTempFiles(context);
                        break;
                }
            }
            else
            {
                json = "501";
            }

            context.Response.Write(json);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public string uploadfile(HttpContext context)
        {
            string rtnValue = "200";

            string fileName = string.Empty;
            string extension = string.Empty;
            string localPath = string.Empty;
            try
            {
                HttpPostedFile file = HttpContext.Current.Request.Files["file"];
                string guid = context.Request["guid"].ToString();
                string woid = (context.Request["woid"] ?? "").ToString();
                int chunks = 0, chunk = 0;

                //chunked file (big file will be chunked upload)
                if (null != context.Request["chunk"] && null != context.Request["chunks"])
                {
                    int.TryParse(context.Request["chunk"].ToString(), out chunk);
                    int.TryParse(context.Request["chunks"].ToString(), out chunks);
                    fileName = guid + "_" + chunk;//temp file name

                    localPath = GenerateTempPath();
                    file.SaveAs(Path.Combine(localPath, fileName));//temp file
                }
                else
                {
                    localPath = GenerateTempPath();
                    extension = Path.GetExtension(file.FileName);
                    fileName = woid + "_" + Guid.NewGuid().ToString("N") + extension;//saved file name
                    file.SaveAs(Path.Combine(localPath, fileName));
                    SaveFileToDB(context, fileName);
                }
            }
            catch (Exception ex)
            {
                rtnValue = "500";
            }
            return rtnValue;
        }

        /// <summary>
        /// merge chunked file
        /// </summary>
        /// <param name="context"></param>
        private string MergeTempFiles(HttpContext context)
        {
            int chunks = 0;
            string tempFileHostName = string.Empty;
            string tempFileName = string.Empty;
            string trueFilePath = string.Empty;
            string trueFileName = string.Empty;
            string woid = string.Empty;
            string rtnValue = "200";
            try
            {
                tempFileHostName = context.Request["guid"].ToString();
                trueFileName = context.Request["name"].ToString();
                Int32.TryParse(context.Request["chunks"], out chunks);

                string savedFileName = Guid.NewGuid().ToString("N") + Path.GetExtension(trueFileName);
                string tempFilePath = GenerateTempPath();
                trueFilePath = Path.Combine(tempFilePath, savedFileName);

                byte[] bytes = null;
                using (FileStream fs = new FileStream(trueFilePath, FileMode.OpenOrCreate))
                {
                    for (int i = 0; i < chunks; i++)
                    {
                        string path = Path.Combine(tempFilePath, tempFileHostName + "_" + i);
                        bytes = System.IO.File.ReadAllBytes(path);
                        fs.Write(bytes, 0, bytes.Length);
                        System.IO.File.Delete(path);
                    }
                    fs.Close();
                }
                SaveFileToDB(context, savedFileName);
            }
            catch (Exception ex)
            {
                rtnValue = "500";
                System.IO.File.Delete(trueFilePath);
            }
            return rtnValue;

        }

        /// <summary>
        /// delete temp file, when unknow-error happened in uploading.
        /// </summary>
        /// <param name="context"></param>
        private void DelTempFiles(HttpContext context)
        {
            int chunks = 0;
            string tempFileHostName = string.Empty;
            string tempFilePath = string.Empty;

            tempFilePath = GenerateTempPath();
            tempFileHostName = context.Request["guid"].ToString();
            Int32.TryParse(context.Request["chunks"], out chunks);
            for (int i = 0; i < chunks; i++)
            {
                string path = Path.Combine(tempFilePath, tempFileHostName + "_" + i);
                File.Delete(path);
            }

        }

        /// <summary>
        /// save attachment info into database
        /// </summary>
        /// <param name="context"></param>
        /// <param name="savedName"></param>
        private void SaveFileToDB(HttpContext context, string savedName)
        {
            //
        }

        private string GenerateTempPath()
        {
            string rtnPath = Path.Combine(HttpRuntime.AppDomainAppPath, "temp");
            if (!Directory.Exists(rtnPath))
            {
                Directory.CreateDirectory(rtnPath);
            }

            return rtnPath;
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}