import UIKit
import WebKit

/// Thin native shell, the iOS twin of MainActivity.java: hosts the shared web UI,
/// does HTTP natively (no CORS), stores data as files, and handles saving/copying.
final class WebViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate, WKURLSchemeHandler {
    private static let scheme = "app"
    private static let origin = "app://local/"

    private var web: WKWebView!
    private var dark = true
    private let kvQueue = DispatchQueue(label: "aidms.kv")
    private lazy var kvDir: URL = {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("kv", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    // The same API surface as AndroidBridge, backed by postMessage.
    private static let bridgeJS = """
    (function () {
      const post = (o) => window.webkit.messageHandlers.bridge.postMessage(o);
      window.IOSBridge = {
        http(id, method, url, headers, body) { post({ op: 'http', id, method, url, headers, body }); },
        kvGet(id, key) { post({ op: 'kvGet', id, key }); },
        kvSet(key, value) { post({ op: 'kvSet', key, value }); },
        kvDel(key) { post({ op: 'kvDel', key }); },
        saveFile(name, content) { post({ op: 'saveFile', name, content }); return 'SHARE'; },
        copy(text) { post({ op: 'copy', text }); },
        setDarkMode(d) { post({ op: 'dark', value: !!d }); }
      };
    })();
    """

    override var preferredStatusBarStyle: UIStatusBarStyle { dark ? .lightContent : .darkContent }

    override func loadView() {
        let root = UIView()
        root.backgroundColor = .black
        view = root

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(self, forURLScheme: Self.scheme)
        let ucc = WKUserContentController()
        ucc.addUserScript(WKUserScript(source: Self.bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.add(WeakHandler(self), name: "bridge")
        config.userContentController = ucc
        config.allowsInlineMediaPlayback = true

        web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .black
        web.scrollView.backgroundColor = .black
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsLinkPreview = false
        web.translatesAutoresizingMaskIntoConstraints = false
        root.addSubview(web)

        // Pin between the status bar and the keyboard (or home indicator),
        // so the page resizes like Android's adjustResize.
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: root.safeAreaLayoutGuide.topAnchor),
            web.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            web.bottomAnchor.constraint(equalTo: root.keyboardLayoutGuide.topAnchor),
        ])
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        web.load(URLRequest(url: URL(string: Self.origin + "index.html")!))
        NotificationCenter.default.addObserver(self, selector: #selector(flush), name: UIApplication.willResignActiveNotification, object: nil)
    }

    @objc private func flush() {
        web.evaluateJavaScript("window.__flush && window.__flush()", completionHandler: nil)
    }

    // MARK: Serve the bundled web UI on app://local/

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let webRoot = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true)
        let file = webRoot.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(webRoot.standardizedFileURL.path), let data = try? Data(contentsOf: file) else {
            let resp = HTTPURLResponse(url: url, statusCode: 404, httpVersion: nil, headerFields: nil)!
            task.didReceive(resp)
            task.didReceive(Data())
            task.didFinish()
            return
        }
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": Self.mime(file.pathExtension), "Content-Length": String(data.count)])!
        task.didReceive(resp)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private static func mime(_ ext: String) -> String {
        switch ext {
        case "html": return "text/html; charset=utf-8"
        case "js": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "png": return "image/png"
        case "svg": return "image/svg+xml"
        case "json": return "application/json"
        default: return "application/octet-stream"
        }
    }

    // MARK: Links open in Safari

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = action.request.url, url.scheme != Self.scheme, url.scheme != "about", url.scheme != "data", url.scheme != "blob" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { UIApplication.shared.open(url) }
        return nil
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: Bridge

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let m = message.body as? [String: Any], let op = m["op"] as? String else { return }
        switch op {
        case "http":
            http(id: m["id"] as? String ?? "", method: m["method"] as? String ?? "GET", url: m["url"] as? String ?? "",
                 headersJSON: m["headers"] as? String ?? "{}", body: m["body"] as? String ?? "")
        case "kvGet":
            let id = m["id"] as? String ?? "", key = m["key"] as? String ?? ""
            kvQueue.async {
                let data = try? Data(contentsOf: self.kvFile(key))
                let arg = data.map { "\"\($0.base64EncodedString())\"" } ?? "null"
                DispatchQueue.main.async { self.web.evaluateJavaScript("window.__kvCb(\(Self.jsString(id)),\(arg))", completionHandler: nil) }
            }
        case "kvSet":
            let key = m["key"] as? String ?? "", value = m["value"] as? String ?? "null"
            kvQueue.async { try? Data(value.utf8).write(to: self.kvFile(key), options: .atomic) }
        case "kvDel":
            let key = m["key"] as? String ?? ""
            kvQueue.async { try? FileManager.default.removeItem(at: self.kvFile(key)) }
        case "saveFile":
            share(name: m["name"] as? String ?? "export.json", content: m["content"] as? String ?? "")
        case "copy":
            UIPasteboard.general.string = m["text"] as? String ?? ""
        case "dark":
            dark = m["value"] as? Bool ?? true
            let bg: UIColor = dark ? .black : .white
            view.backgroundColor = bg
            web.backgroundColor = bg
            web.scrollView.backgroundColor = bg
            overrideUserInterfaceStyle = dark ? .dark : .light
            setNeedsStatusBarAppearanceUpdate()
        default:
            break
        }
    }

    private func kvFile(_ key: String) -> URL {
        let safe = key.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? key
        return kvDir.appendingPathComponent(safe + ".json")
    }

    private static func jsString(_ s: String) -> String {
        let data = try! JSONSerialization.data(withJSONObject: [s])
        let arr = String(data: data, encoding: .utf8)!
        return String(arr.dropFirst().dropLast())
    }

    private func deliver(_ id: String, _ status: Int, _ body: Data) {
        let js = "window.__httpCb(\(Self.jsString(id)),\(status),\"\(body.base64EncodedString())\")"
        DispatchQueue.main.async { self.web.evaluateJavaScript(js, completionHandler: nil) }
    }

    private func http(id: String, method: String, url: String, headersJSON: String, body: String) {
        guard let u = URL(string: url) else {
            deliver(id, 0, Data("Network error: invalid URL".utf8))
            return
        }
        var req = URLRequest(url: u, timeoutInterval: 180)
        req.httpMethod = method
        if let hd = headersJSON.data(using: .utf8),
           let h = (try? JSONSerialization.jsonObject(with: hd)) as? [String: String] {
            for (k, v) in h { req.setValue(v, forHTTPHeaderField: k) }
        }
        if !body.isEmpty && method != "GET" { req.httpBody = Data(body.utf8) }
        URLSession.shared.dataTask(with: req) { data, resp, err in
            if let err = err {
                self.deliver(id, 0, Data("Network error: \(err.localizedDescription)".utf8))
                return
            }
            self.deliver(id, (resp as? HTTPURLResponse)?.statusCode ?? 0, data ?? Data())
        }.resume()
    }

    private func share(name: String, content: String) {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do { try Data(content.utf8).write(to: url, options: .atomic) } catch { return }
        let vc = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        vc.popoverPresentationController?.sourceView = view
        vc.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 40, width: 1, height: 1)
        present(vc, animated: true)
    }
}

/// Avoids the retain cycle between WKUserContentController and the controller.
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}
