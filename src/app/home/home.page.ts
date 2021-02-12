import { Component } from '@angular/core';
import { CameraPhoto, FilesystemDirectory, Plugins } from "@capacitor/core"
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
  public image = null;
  cameraActive = false;
  public photos: Photo[] = [];


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
    
    // setInterval( ()=>{this.captureCamera()},500 );
  }

  async captureCamera() {
    const cameraPreviewPictureOptions: CameraPreviewPictureOptions = {
      quality: 100
    };
    
    const result = await CameraPreview.capture(cameraPreviewPictureOptions);
    this.image = `data:image/jpeg;base64,${result.value}`;
    this.savePicture(result, this.image);
  }

  async savePicture(cameraPhoto: CameraPhoto, base64: string) {
    await this.mkdir();


    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    try {
      const savedFile = await Filesystem.writeFile({
        path: 'EasyScanner/' + fileName,
        data: this.image,
        directory: FilesystemDirectory.Documents,
        // recursive: true,     // Eğer foto çekerken kasma alursa mkdir devre dışı bırakılıp burası aktif edilmeli!
      })
      console.log('Wrote file', savedFile);
    } catch(e) {
      console.error('Unable to write file', e);
    }

    const savedImageFile = {
      filepath: fileName,
      // webviewPath: cameraPhoto.webPath
    };

    this.photos.unshift(savedImageFile);
  }

  async mkdir() {
    try {
      let ret = await Filesystem.mkdir({
        path: 'EasyScanner',
        recursive: false, // like mkdir -p
        directory: FilesystemDirectory.Documents,
      });
    } catch(e) {
      console.log('This directory already exist.');
    }
  }

  flipCamera() {
    CameraPreview.flip();
  }

  async stopCamera() {
    await CameraPreview.stop();
    this.cameraActive = false;
  }

}


export interface Photo {
  filepath: string;
  // webviewPath: string;
}