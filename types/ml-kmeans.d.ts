declare module 'ml-kmeans' {
  export interface KMeansCentroid {
    centroid: number[];
    size?: number;
  }

  export interface KMeansResult {
    clusters: number[][];
    centroids: KMeansCentroid[];
  }

  export interface KMeansOptions {
    initialization?: 'kmeans++' | 'random' | number[][];
    maxIterations?: number;
    tolerance?: number;
  }

  export default function kmeans(
    data: number[][],
    k: number,
    options?: KMeansOptions
  ): KMeansResult;
}
