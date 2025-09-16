package com.example.theevent

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.example.theevent.ui.theme.TheEventTheme
import java.io.File

class MainActivity : ComponentActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoUri: Uri? = null

    private val cameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val data = result.data
            val results: Array<Uri>? = when {
                result.resultCode == Activity.RESULT_OK && data?.data != null -> arrayOf(data.data!!)
                result.resultCode == Activity.RESULT_OK && cameraPhotoUri != null -> arrayOf(cameraPhotoUri!!)
                else -> null
            }
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
            cameraPhotoUri = null
        }

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Request camera permission if not granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        setContent {
            TheEventTheme {
                var url by remember { mutableStateOf("http://10.100.128.90:5173/") }
                var tempUrl by remember { mutableStateOf(url) }
                var showUrlField by remember { mutableStateOf(true) }
                var webViewError by remember { mutableStateOf(false) }

                val webView = remember {
                    WebView(this).apply {
                        webViewClient = object : WebViewClient() {
                            override fun onReceivedError(
                                view: WebView?,
                                request: WebResourceRequest?,
                                error: WebResourceError?
                            ) { webViewError = true }

                            override fun onPageFinished(view: WebView?, url: String?) { webViewError = false }
                        }

                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            useWideViewPort = true
                            loadWithOverviewMode = true
                            builtInZoomControls = true
                            displayZoomControls = false
                            allowFileAccess = true
                            allowContentAccess = true
                        }

                        webChromeClient = object : WebChromeClient() {
                            override fun onShowFileChooser(
                                webView: WebView?,
                                filePathCallback: ValueCallback<Array<Uri>>?,
                                fileChooserParams: FileChooserParams?
                            ): Boolean {
                                this@MainActivity.filePathCallback = filePathCallback

                                // Camera intent
                                val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                                val photoFile = File(cacheDir, "camera_photo.jpg")
                                cameraPhotoUri = FileProvider.getUriForFile(
                                    this@MainActivity,
                                    "${packageName}.fileprovider",
                                    photoFile
                                )
                                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri)
                                takePictureIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)

                                // File picker intent
                                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                                    addCategory(Intent.CATEGORY_OPENABLE)
                                    type = "*/*"
                                }

                                // Chooser
                                val chooserIntent = Intent.createChooser(
                                    contentSelectionIntent,
                                    "Select or take a photo"
                                )
                                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
                                fileChooserLauncher.launch(chooserIntent)
                                return true
                            }

                            override fun onPermissionRequest(request: PermissionRequest?) {
                                request?.grant(request?.resources)
                            }
                        }

                        loadUrl(url)
                    }
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        TopAppBar(
                            title = { },
                            colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = Color(0xFF006400)),
                            actions = {
                                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                                    Text("Edit URL", color = Color.White)
                                    Switch(
                                        checked = showUrlField,
                                        onCheckedChange = { showUrlField = it },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Color.White,
                                            uncheckedThumbColor = Color.LightGray
                                        )
                                    )
                                }
                            }
                        )
                    }
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        if (showUrlField || webViewError) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = tempUrl,
                                    onValueChange = { tempUrl = it },
                                    label = { Text("Enter Web URL") },
                                    modifier = Modifier.weight(1f),
                                    colors = TextFieldDefaults.outlinedTextFieldColors(
                                        focusedBorderColor = Color(0xFF90EE90),
                                        unfocusedBorderColor = Color(0xFF90EE90),
                                        cursorColor = Color(0xFF90EE90)
                                    )
                                )
                                Button(onClick = {
                                    url = tempUrl
                                    webView.loadUrl(url)
                                }) { Text("Done") }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }

                        AndroidView(factory = { webView }, modifier = Modifier.fillMaxSize())
                    }
                }
            }
        }
    }
}
