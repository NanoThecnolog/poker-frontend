import axios, { AxiosInstance } from "axios";


const url = "http://localhost:2121";
if (!url) console.error("variável de ambiente não configurada.")

export class SetupAPIClient {
    public backend: AxiosInstance
    constructor() {
        this.backend = axios.create({
            baseURL: url,
        })

    }
}