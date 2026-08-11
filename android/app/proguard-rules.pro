# Enable class repackaging and code optimization
-repackageclasses ''
-allowaccessmodification

# React Native & Native Modules ProGuard Keep Rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.focuslock.** { *; }

# Keep native module methods
-keepclasseswithmembers class * {
    native <methods>;
}

# Preserve Reflection Annotations & Signatures
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

