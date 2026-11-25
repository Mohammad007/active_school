import os
import runpy
from pathlib import Path

# NTFS alternate data streams retain the Library metadata on Windows.
def setxattr(path, name, value):
    Path(str(path) + ':' + os.fsdecode(name)).write_bytes(value)

def getxattr(path, name):
    return Path(str(path) + ':' + os.fsdecode(name)).read_bytes()

os.setxattr = setxattr
os.getxattr = getxattr
runpy.run_path(str(Path(__file__).with_name('library_file_transfer.py')), run_name='__main__')
