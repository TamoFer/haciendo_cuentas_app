import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';



@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  utilsSvs = inject(UtilsService);
  storage = inject(AngularFireStorage);

  getAuth() {
    return getAuth();
  }


  // logearse
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password)
  }

  // deslogearse
  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvs.routerLink('/auth');
  }

  //crear usuario  
  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password)
  }

  //actualizar usuario
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName })
  }

  // recuperar contra con email
  enviarRecuperacion(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  //base de datos setear
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  // obtener datos de firebase bd
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  //agregar datos a la BD
  addDocument(path: string, data: any) {
    return addDoc(collection(getFirestore(), path), data);
  }
}
