Scriptname PrismaUI Native Hidden
{Framework-native Prisma UI control. Views are addressed by a caller-chosen string name.}

bool Function CreateView(string asName, string asHtmlPath) global native
Function Push(string asName, string asFunction, string asJson) global native
Function Show(string asName) global native
Function Hide(string asName) global native
Function Destroy(string asName) global native
bool Function IsValid(string asName) global native

; Creates a dedicated CEF render texture for this view. Set true before either bind call.
Function SetOffscreen(string asName, bool abOffscreen) global native

; Bind by exact BSGeometry node name, e.g. "Screen:0".
; The framework retries briefly while the reference 3D and view texture come online.
bool Function BindToObject(string asName, ObjectReference akRef, string asNode, bool abFirstPerson) global native

; Bind by a case-insensitive substring of the current diffuse texture path. This is useful when
; replacers rename screen nodes but retain a recognizable material, e.g. "terminalscreen" or "tv".
bool Function BindToTexture(string asName, ObjectReference akRef, string asTextureSubstring, bool abFirstPerson) global native

Function Unbind(string asName) global native
