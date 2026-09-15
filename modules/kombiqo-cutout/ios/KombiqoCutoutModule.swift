import ExpoModulesCore
import Vision
import CoreImage
import UIKit

public class KombiqoCutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KombiqoCutout")

    Function("isSupported") { () -> Bool in
      if #available(iOS 17.0, *) { return true }
      return false
    }

    // Expo runs synchronous AsyncFunction bodies on a background queue.
    AsyncFunction("removeBackground") { (source: String) -> String in
      guard #available(iOS 17.0, *) else {
        throw CutoutError("Arka plan temizleme için iOS 17 veya üzeri gerekir.")
      }
      let bytes: Data
      if source.hasPrefix("data:image/"), let comma = source.firstIndex(of: ","),
         let decoded = Data(base64Encoded: String(source[source.index(after: comma)...])) {
        bytes = decoded
      } else if let url = URL(string: source), url.isFileURL {
        bytes = try Data(contentsOf: url)
      } else {
        throw CutoutError("Fotoğraf okunamadı.")
      }
      guard let image = UIImage(data: bytes) else { throw CutoutError("Geçersiz fotoğraf.") }
      // Normalize orientation and bound memory use before inference.
      let scale = min(1.0, 1536.0 / max(image.size.width, image.size.height))
      let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
      let format = UIGraphicsImageRendererFormat()
      format.scale = 1
      let normalized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
        image.draw(in: CGRect(origin: .zero, size: size))
      }
      guard let cgImage = normalized.cgImage else { throw CutoutError("Fotoğraf hazırlanamadı.") }
      let request = VNGenerateForegroundInstanceMaskRequest()
      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      try handler.perform([request])
      guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
        throw CutoutError("Ürün ayrılamadı. Kıyafetin tamamının göründüğü daha aydınlık bir fotoğraf dene.")
      }
      let buffer = try observation.generateMaskedImage(
        ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
      let output = CIImage(cvPixelBuffer: buffer)
      guard let rendered = CIContext().createCGImage(output, from: output.extent),
            let png = UIImage(cgImage: rendered).pngData() else {
        throw CutoutError("Temizlenen fotoğraf oluşturulamadı.")
      }
      return "data:image/png;base64," + png.base64EncodedString()
    }
  }
}

private struct CutoutError: LocalizedError {
  let message: String
  init(_ message: String) { self.message = message }
  var errorDescription: String? { message }
}
