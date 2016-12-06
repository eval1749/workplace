using System;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;


class EhGet
{
    private static void fetchImage(
        String imageUri,
        String jpgName,
        String pageUri)
    {
        HttpWebRequest request = (HttpWebRequest) WebRequest.Create(imageUri);

        request.Accept = "image/png,image/*;q=0.8;*/*;q=0.5";
        request.KeepAlive = true;
        request.Referer = pageUri;
        request.UserAgent = "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)";

        Console.WriteLine("{0}", request.Headers);

        using (HttpWebResponse response = (HttpWebResponse) request.GetResponse())
        {
            Console.WriteLine("{0} {1}",
                response.StatusCode,
                response.Headers);

            using (Stream dataStream = response.GetResponseStream())
            using (FileStream img = File.Create(jpgName))
            {
                for (;;)
                {
                    int b = dataStream.ReadByte();
                    if (b < 0)
                    {
                        break;
                    }

                    img.WriteByte((byte) b);
                } // for
            } // using
        } // using
    } // fetchImage

    private static int processAll(
        String page1Uri,
        int startPage,
        int endPage)
    {
        //Regex rx = new Regex(@"^http://.*-jpg/(\d+)-\d+$");
        // http://g.e-hentai.org/s/751ae2513f/7554-1
        Regex rx = new Regex(@"^http://.*/(\d+)-\d+$");
        Match match = rx.Match(page1Uri);

        if (!match.Success) {
            Console.WriteLine("Bad URI: {0}", page1Uri);
            return 1;
        } // if

        String key = match.Groups[1].Captures[0].Value;
        Console.WriteLine("key={0}", key);

        String uri = page1Uri;
        for (int page = startPage; page <= endPage; page++) {
            Console.WriteLine("{0}", uri);
            uri = processOne(
                uri,
                key,
                page,
                page < endPage ? page + 1 : endPage);
            if (null == uri)
            {
                break;
            }

            Thread.Sleep(20 * 1000);
        } // for i

        return 0;
    } // processAll

    private static String processOne(
        String htmlUri,
        String key,
        int page,
        int nextPage)
    {
        HttpWebRequest request = (HttpWebRequest) WebRequest.Create(htmlUri);
        request.UserAgent = "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)";
        using (HttpWebResponse response = (HttpWebResponse) request.GetResponse())
        {
            Console.WriteLine("{0} {1}",
                response.StatusCode,
                response.Headers);

            using (
                Stream dataStream = new GZipStream(
                    response.GetResponseStream(),
                    CompressionMode.Decompress))

            using (StreamReader reader = new StreamReader(dataStream))
            {
                String html = reader.ReadToEnd();

                {
                    Regex imageRx = new Regex(
                        String.Format("/{0}-{1}\"><img src=\"(http://[^\"]+[.]jpg)\"",
                            key,
                            nextPage));

                    Match match = imageRx.Match(html);
                    if (!match.Success) {
                        Console.WriteLine("No image URI!: {0}", html);
                        return null;
                    } // if

                    String imageUri = match.Groups[1].Captures[0].Value;
                    Console.WriteLine("imageUri={0}", imageUri);

                    try
                    {
                        fetchImage(
                            imageUri,
                            String.Format("{0:D3}.jpg", page),
                            htmlUri);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("{0}", e);
                    }
                }

                if (nextPage == page)
                {
                    return null;
                }

                {
                    Regex nextRx = new Regex(
                        String.Format("http://g.e-hentai.org/s/[-a-z0-9]+/{0}-{1}",
                            key,
                            page + 1));

                    Match match = nextRx.Match(html);
                    if (!match.Success) {
                        Console.WriteLine("No next URI: {0}", html);
                        System.Environment.Exit(1);
                    } // if
                    return match.Groups[0].Captures[0].Value;
                }
            } // using
        } // using response
    } // processOne

    public static int Main(String[] args)
    {
        if (3 != args.Length) {
            Console.WriteLine("Usage: ehget.exe uri start end");
        } // if

        return processAll(
            args[0],
            Int32.Parse(args[1]),
            Int32.Parse(args[2]));
    } // Main
} // EhGet
