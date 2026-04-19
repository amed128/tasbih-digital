package com.amedn128.tasbihdigital

import android.content.ComponentName
import android.content.pm.PackageManager
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AppIcon")
class AppIconPlugin : Plugin() {

    private val ALIASES = mapOf(
        "AppIconDark" to ".MainActivityDark",
        "AppIconBlue" to ".MainActivityBlue",
    )
    private val DEFAULT_ACTIVITY = ".MainActivity"

    @PluginMethod
    fun setIcon(call: PluginCall) {
        val name = call.getString("name") // null = default
        val pkg  = context.packageName
        val pm   = context.packageManager

        // Disable all aliases + re-enable the right one atomically
        val targetSuffix = if (name != null) ALIASES[name] else DEFAULT_ACTIVITY
        if (targetSuffix == null) {
            call.reject("Unknown icon name: $name")
            return
        }

        // Disable non-target aliases / main activity as needed
        val allSuffixes = listOf(DEFAULT_ACTIVITY) + ALIASES.values
        for (suffix in allSuffixes) {
            val state = if (suffix == targetSuffix)
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            else
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            pm.setComponentEnabledSetting(
                ComponentName(pkg, pkg + suffix),
                state,
                PackageManager.DONT_KILL_APP
            )
        }

        call.resolve()
    }
}
