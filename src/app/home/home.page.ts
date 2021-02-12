import { Component } from '@angular/core';
import { FilesystemDirectory, Plugins } from "@capacitor/core"
const { CameraPreview, Filesystem } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';

// Needed for web registration!
import '@capacitor-community/camera-preview'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  image = null;
  cameraActive = false;


  constructor() {}

  openCamera() {
    const cameraPreviewOptions: CameraPreviewOptions = {
      position: 'rear',
      parent: "cameraPreview",
      className: "cameraPreview",
      paddingBottom: 50,
    };
    CameraPreview.start(cameraPreviewOptions);
    this.cameraActive = true;    
  }

  async stopCamera() {
    await CameraPreview.stop();
    this.cameraActive = false;
  }

  async captureCamera() {
    const cameraPreviewPictureOptions: CameraPreviewPictureOptions = {
      quality: 90
    };
    
    const result = await CameraPreview.capture(cameraPreviewPictureOptions);
    
    this.image = `data:image/jpeg;base64,${result.value}`;
    console.log("Base64 ümüz: ",this.image);
    
    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: this.image,
      directory: FilesystemDirectory.Data
    });

    this.stopCamera();
  }

  flipCamera() {
    CameraPreview.flip();
  }

}
