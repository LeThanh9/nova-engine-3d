using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;

namespace NovaEngine3D
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _baseDir;
        private static volatile bool _running = true;

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                _baseDir = AppDomain.CurrentDomain.BaseDirectory;

                // Pick a free local loopback port
                int port = GetFreeTcpPort();
                string prefix = string.Format("http://127.0.0.1:{0}/", port);

                _listener = new HttpListener();
                _listener.Prefixes.Add(prefix);
                _listener.Start();

                Thread serverThread = new Thread(ServerLoop);
                serverThread.IsBackground = true;
                serverThread.Start();

                // Find modern Chromium browser engine (Microsoft Edge or Google Chrome)
                string browserPath = FindBrowser();
                if (string.IsNullOrEmpty(browserPath))
                {
                    MessageBox.Show(
                        "Không tìm thấy Microsoft Edge hoặc Google Chrome để chạy NovaEngine 3D.",
                        "Lỗi Khởi Động NovaEngine 3D",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string userDataDir = Path.Combine(Path.GetTempPath(), "NovaEngine3D_Profile");
                string arguments = string.Format(
                    "--app={0}index.html --window-size=1520,920 --enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --use-gl=angle --use-angle=d3d11 --autoplay-policy=no-user-gesture-required --user-data-dir=\"{1}\"",
                    prefix,
                    userDataDir
                );

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserPath;
                psi.Arguments = arguments;
                psi.UseShellExecute = false;

                Process proc = Process.Start(psi);
                if (proc != null)
                {
                    proc.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Lỗi khi khởi chạy NovaEngine 3D Studio:\n" + ex.Message,
                    "NovaEngine 3D Studio",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            finally
            {
                _running = false;
                try
                {
                    if (_listener != null && _listener.IsListening)
                    {
                        _listener.Stop();
                    }
                }
                catch { }
            }
        }

        private static int GetFreeTcpPort()
        {
            TcpListener l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        private static string FindBrowser()
        {
            string[] paths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void ServerLoop()
        {
            while (_running)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string rawUrl = context.Request.Url.AbsolutePath;
                if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl)) rawUrl = "/index.html";

                string relPath = rawUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string filePath = Path.Combine(_baseDir, relPath);

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(Path.GetExtension(filePath));
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.StatusCode = 200;
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                    byte[] notFound = System.Text.Encoding.UTF8.GetBytes("404 Not Found");
                    context.Response.OutputStream.Write(notFound, 0, notFound.Length);
                }
            }
            catch { }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
            }
        }

        private static string GetMimeType(string ext)
        {
            switch (ext.ToLower())
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                default: return "application/octet-stream";
            }
        }
    }
}

