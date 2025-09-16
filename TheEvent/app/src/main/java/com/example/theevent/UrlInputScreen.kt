package com.example.theevent

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun UrlInputScreen(onUrlSubmit: (String) -> Unit) {
    var url by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            value = url,
            onValueChange = { url = it },
            label = { Text("Enter UI URL") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { if (url.isNotEmpty()) onUrlSubmit(url) },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Load UI")
        }
    }
}
