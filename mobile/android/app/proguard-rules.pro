# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-av references KeepAwakeManager which was removed from expo-modules-core 55.x.
# Only the fullscreen-video keep-awake path touches it; safe to suppress for R8.
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager

# Add any project specific keep options here:
