import { Component } from '@angular/core';
import { CameraPhoto, Capacitor, FilesystemDirectory, Plugins } from "@capacitor/core"
const { CameraPreview, Filesystem, Storage } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';
import { Platform } from '@ionic/angular';
import '@capacitor-community/camera-preview';
import { loadImage } from 'canvas';
import { Screenshot } from '@ionic-native/screenshot/ngx';


declare var cv: any;

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
  private capture_timer = null;

  constructor(platform: Platform, private screenshot: Screenshot) {
    this.platform = platform;
    // console.log(cv.getBuildInformation());
  }

  async ngOnInit() {
    await Storage.remove({ key: "images" });
    this.loadSaved();
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

  async openCamera() {
    const cameraPreviewOptions: CameraPreviewOptions = {
      position: 'rear',
      parent: "cameraPreview",
      className: "cameraPreview",
      paddingBottom: 50,
    };
    await CameraPreview.start(cameraPreviewOptions);
    this.cameraActive = true;
    
    this.capture_timer = setInterval( ()=>{this.captureCamera()},500 );
  }

  async captureCamera() {
    this.screenshot.URI(80).then((res) => {
      console.log(res);
    }, (err) => {
      console.log(err);
    });
    

    // const cameraPreviewPictureOptions: CameraPreviewPictureOptions = {
    //   quality: 100
    // };
    
    // const result = await CameraPreview.capture(cameraPreviewPictureOptions);
    // this.image = `data:image/jpeg;base64,${result.value}`;
    // this.savePicture(result, this.image);

    // const img_element = document.getElementById('image');
    // const original_image = cv.imread(img_element);
    // cv.cvtColor(original_image,original_image,cv.COLOR_RGB2GRAY);
    // cv.imshow('output', original_image);
    // original_image.delete();
    

    // let img = await loadImage("./assets/icon/favicon.png");
    // let src = cv.imread(img);
    // let dst = new cv.Mat();
    // cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    // cv.imshow('output', dst);
    // src.delete();
    // dst.delete();

  }

  async savePicture(cameraPhoto: CameraPhoto, base64: string) {
    // await this.mkdir();


    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    try {
      const savedFile = await Filesystem.writeFile({
        path: 'EasyScanner/' + fileName,
        data: base64,
        directory: FilesystemDirectory.Documents,
        recursive: true,     // Eğer foto çekerken kasma alursa mkdir devre dışı bırakılıp burası aktif edilmeli!
      })

      let img = await loadImage("./assets/icon/favicon.png");
      let src = cv.imread(img);
      let dst = new cv.Mat();
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
      cv.imshow('output', dst);
      src.delete();
      dst.delete();

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
    clearInterval(this.capture_timer);
    await CameraPreview.stop();
    this.loadSaved();
    this.cameraActive = false;
  }

}


export interface Photo {
  filepath: string;
  webviewPath: string;
}