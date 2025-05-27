using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace HmXGrokWeb;

public partial class HmXGrokWeb
{
    public void SendToClipboard(string text)
    {
        Clipboard.SetText(text);
    }

    private Dictionary<string, object> storedData = new Dictionary<string, object>();

    // クリップボードの内容を記憶
    public void CaptureClipboard()
    {
        try
        {
            storedData.Clear();

            IDataObject dataObject = Clipboard.GetDataObject();
            if (dataObject == null) return;

            foreach (string format in dataObject.GetFormats())
            {
                try
                {
                    object data = dataObject.GetData(format);

                    // Stream（画像やファイル）などはメモリにコピー
                    if (data is MemoryStream stream)
                    {
                        MemoryStream copy = new MemoryStream();
                        stream.Position = 0;
                        stream.CopyTo(copy);
                        copy.Position = 0;
                        storedData[format] = copy;
                    }
                    else if (data is string text)
                    {
                        storedData[format] = string.Copy(text);
                    }
                    else if (data is string[] array)
                    {
                        storedData[format] = (string[])array.Clone();
                    }
                    else
                    {
                        storedData[format] = data; // 可能な限りコピー
                    }
                }
                catch
                {
                    // 一部の形式は例外が出るためスキップ
                }
            }

        }
        catch (Exception ex)
        {
            // クリップボードの取得に失敗した場合は何もしない
        }
    }

    // 保存しておいたデータをクリップボードに戻す
    public void RestoreClipboard()
    {
        try
        {
            DataObject newData = new DataObject();

            foreach (var kvp in storedData)
            {
                newData.SetData(kvp.Key, kvp.Value);
            }

            Clipboard.SetDataObject(newData, true);
        }
        catch (Exception ex)
        {
            // クリップボードの復元に失敗した場合は何もしない
        }
    }
}
