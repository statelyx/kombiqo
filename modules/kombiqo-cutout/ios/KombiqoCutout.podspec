Pod::Spec.new do |s|
  s.name = 'KombiqoCutout'
  s.version = '0.1.0'
  s.summary = 'On-device foreground cutout for Kombiqo'
  s.description = 'Apple Vision foreground masking with transparent PNG output.'
  s.license = { :type => 'Proprietary' }
  s.author = 'Kombiqo'
  s.homepage = 'https://github.com/statelyx/kombiqo'
  s.source = { :git => 'https://github.com/statelyx/kombiqo.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'CoreImage', 'UIKit'
  s.source_files = '**/*.swift'
end
