import { Component } from '@angular/core';
import { CameraPhoto, Capacitor, FilesystemDirectory, Plugins } from "@capacitor/core"
const { CameraPreview, Filesystem, Storage } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';
import { Platform } from '@ionic/angular';

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
  private PHOTO_STORAGE: string = "images";
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
    // Storage.remove({ key: "allphotos" });
    // Storage.remove({ key: "photos" });
    // Storage.remove({ key: "images" });
  }

  async ngOnInit() {
    await this.loadSaved();
  }

  async loadSaved() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      for (let photo of this.photos) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
            path: 'EasyScanner/' + photo.filepath,
            directory: FilesystemDirectory.Documents
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        
      }
      
    }
  }

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
        data: base64,
        directory: FilesystemDirectory.Documents,
        // recursive: true,     // Eğer foto çekerken kasma alursa mkdir devre dışı bırakılıp burası aktif edilmeli!
      })

      let savedObject = null;
      if (this.platform.is('hybrid')) {
        savedObject = {
          filepath: fileName,
          webviewPath: Capacitor.convertFileSrc(savedFile.uri)
        };
      } else {
        savedObject = {
          filepath: fileName,
          webviewPath: ""
        };
      }

      
  
      this.photos.unshift(savedObject);
  
      Storage.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos)
      });

      console.log('Wrote file', savedFile.uri);
    } catch(e) {
      console.error('Unable to write file', e);
    }
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
    this.loadSaved();
  }

}


export interface Photo {
  filepath: string;
  webviewPath: string;
}