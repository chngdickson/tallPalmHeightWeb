
```
└── 📦 project_root (Field_A)
    ├── 📂 TopView
    │   ├── 🖼️ coordinates.png
    │   └── 🖼️ height_and_index.png
    ├── 📂 SideView
    │   ├── 🖼️ tree1.png
    │   └── 🖼️ tree2.png
    ├── 📂 TreeIndividual
    │   ├── 📄 tree1.laz
    │   └── 📄 tree2.laz
    └── 📄 excelfile.xlx
```

**File Name:** `Field_A_LatLong.xlsx`

| Palm ID | Image File   | H (m) | Data type | X or Longitude  | Y or Latitude |
| :---:   | :---         | :---: | :---:    | :---:           | :---:    |
| **1**   | `tree1.png`  | 12.5  | Lat/long | 103.9215        | 1.3421   | 
| **2**   | `tree2.png`  | 8.7   | Lat/long | 103.9220        | 1.3425   | 
| **3**   | `tree3.png`  | 15.0  | Lat/long | 103.9208        | 1.3418   | 
| **...** | ...          | ...   | ...      | ...             | ...      |

---


**File Name:** `Field_A_XYZ.xlsx`

| Palm ID | Image File   | H (m) | Data type | X or Longitude        | Y or Latitude       | 
| :---:   | :---         | :---: | :---:    | :---:   | :---: |
| **1**   | `tree1.png`  | 10.2  | xyz   | 150.25   | -25.75  | xyz   |
| **2**   | `tree2.png`  | 9.1   | xyz   | 151.10   | -26.00  | xyz   |
| **3**   | `tree3.png`  | 9.1   | xyz   | 121.10   | -23.00  | xyz   |
| **...** | ...          | ...   | ...      | ...     | ...   |




---Folder-Structure---
- TopView
 --> coordinates.png
 --> height_and_index.png
- SideView
 --> tree1.png
 --> tree2.png 
excelfile.png

└── 📦 downloaded_zip_file
    ├── 📂 TopView
    │   ├── 🖼️ coordinates.png
    │   └── 🖼️ height_and_index.png
    ├── 📂 SideView
    │   ├── 🖼️ tree1.png
    │   └── 🖼️ tree2.png
    └── 📄 excelfile.xlx



```
Sheet Name: Detected Palms
Palm ID	Dtype	H (m)	X (Longitude)	Y (Latitude)	Idx (Image File)
1	Lat/long	12.5	103.9215	1.3421	palm_index_1.png
2	Lat/long	8.7	103.9220	1.3425	palm_index_2.png
3	xyz	10.2	150.25	-25.75	palm_index_3.png
4	Lat/long	15.0	103.9208	1.3418	palm_index_4.png
...	...	...	...	...	...