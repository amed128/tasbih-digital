import Capacitor

@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin {
    // name: "AppIconDark" | "AppIconBlue" | null (null resets to default)
    @objc func setIcon(_ call: CAPPluginCall) {
        let iconName = call.getString("name") // nil = default icon

        guard UIApplication.shared.supportsAlternateIcons else {
            call.reject("Alternate icons not supported on this device")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.setAlternateIconName(iconName) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }
}
