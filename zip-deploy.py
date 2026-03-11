import os
import zipfile

def create_zip():
    zipf = zipfile.ZipFile('sistema-comercial.zip', 'w', zipfile.ZIP_DEFLATED)
    
    # Files to include directly
    files_to_include = [
        '.env',
        'package.json',
        'package-lock.json',
        'next.config.ts',
        'tsconfig.json',
        'postcss.config.mjs',
        'eslint.config.mjs'
    ]
    
    for f in files_to_include:
        if os.path.exists(f):
            print(f"Adding {f}")
            zipf.write(f)
            
    # Directories to include
    dirs_to_include = ['src', 'public', 'prisma']
    
    for d in dirs_to_include:
        for root, dirs, files in os.walk(d):
            for file in files:
                if file != '.DS_Store':
                    file_path = os.path.join(root, file)
                    try:
                        print(f"Adding {file_path}")
                        zipf.write(file_path, file_path)
                    except Exception as e:
                        print(f"Skipping {file_path}: {e}")
                        
    zipf.close()
    print("Done creating sistema-comercial.zip!")

if __name__ == '__main__':
    create_zip()
