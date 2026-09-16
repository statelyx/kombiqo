import ExpoModulesCore
import Vision
import CoreImage
import UIKit

public class KombiqoCutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KombiqoCutout")

    // No network or downloaded model: Vision's built-in classifier and text recognition.
    AsyncFunction("analyzeImage") { (source: String) -> [String: Any] in
      let bytes: Data
      if source.hasPrefix("data:image/"), let comma = source.firstIndex(of: ","),
         let decoded = Data(base64Encoded: String(source[source.index(after: comma)...])) {
        bytes = decoded
      } else if let url = URL(string: source), url.isFileURL {
        bytes = try Data(contentsOf: url)
      } else { throw CutoutError("Fotoğraf okunamadı.") }
      guard let image = UIImage(data: bytes), image.size.width > 0, image.size.height > 0 else {
        throw CutoutError("Geçersiz fotoğraf.")
      }
      let scale = min(1.0, 1024.0 / max(image.size.width, image.size.height))
      let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
      let format = UIGraphicsImageRendererFormat(); format.scale = 1
      let normalized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
        image.draw(in: CGRect(origin: .zero, size: size))
      }
      guard let cg = normalized.cgImage else { throw CutoutError("Fotoğraf hazırlanamadı.") }
      let handler = VNImageRequestHandler(cgImage: cg, options: [:])
      let classify = VNClassifyImageRequest()
      try? handler.perform([classify])
      let labels: [[String: Any]] = (classify.results ?? []).filter { $0.confidence >= 0.65 }.prefix(12).map {
        ["label": $0.identifier, "confidence": Double($0.confidence)]
      }
      let recognize = VNRecognizeTextRequest()
      recognize.recognitionLevel = .accurate
      recognize.usesLanguageCorrection = false
      try? handler.perform([recognize])
      let text = (recognize.results ?? []).compactMap { observation -> String? in
        guard let candidate = observation.topCandidates(1).first, candidate.confidence >= 0.7 else { return nil }
        return String(candidate.string.prefix(120))
      }
      // Sample only the central clothing area. This is a color suggestion, not segmentation.
      let rect = CGRect(x: Double(cg.width) * 0.3, y: Double(cg.height) * 0.25,
                        width: Double(cg.width) * 0.4, height: Double(cg.height) * 0.5)
      var pixels = [UInt8](repeating: 0, count: 24 * 24 * 4)
      if let crop = cg.cropping(to: rect) {
        pixels.withUnsafeMutableBytes { raw in
          if let context = CGContext(data: raw.baseAddress, width: 24, height: 24, bitsPerComponent: 8,
                                     bytesPerRow: 96, space: CGColorSpaceCreateDeviceRGB(),
                                     bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue) {
            context.draw(crop, in: CGRect(x: 0, y: 0, width: 24, height: 24))
          }
        }
      }
      return ["labels": labels, "text": Array(text.prefix(30)), "pixels": pixels.map { Int($0) }]
    }

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
      // A foreground mask also includes a person wearing the garment. Do not present
      // that as a clean product or invent the hidden parts of the clothing.
      let people = VNDetectHumanRectanglesRequest()
      people.upperBodyOnly = false
      try handler.perform([people])
      if (people.results ?? []).contains(where: { $0.confidence >= 0.5 }) {
        throw CutoutError("Fotoğrafta kişi görünüyor. Yalnızca ürünü ayırmak için kıyafetin tek başına, düz zemindeki fotoğrafını seç. Orijinal fotoğrafın korundu.")
      }
      try handler.perform([request])
      guard let observation = request.results?.first, observation.allInstances.count == 1 else {
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
