use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn get_string(public_key: *const c_char, username: *const c_char) -> *mut c_char {
    let public_key_str = unsafe { CStr::from_ptr(public_key).to_string_lossy() };
    let username_str = unsafe { CStr::from_ptr(username).to_string_lossy() };

    let my_public_key_hex_str = "45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a";
    let my_public_key_str = CString::new(my_public_key_hex_str).expect("CString::new failed");
    let my_public_key_str = my_public_key_str.to_string_lossy();

    let cat_ascii_art = r#"
            /\___/\
           )       (
          =\       /=
            )     (
           /       \
          /         \
          \         /
           \__  __/
              ))
             //
            ((
             \)
        "#;
    let result_string = if public_key_str == my_public_key_str {
        format!("oh, hello myself!\n{}", cat_ascii_art)
    } else {
        format!(
            "hi {}, thanks for visiting me, feel free to check all my notes!\n{}",
            username_str, cat_ascii_art
        )
    };

    let result_cstring = CString::new(result_string).expect("CString::new failed");
    result_cstring.into_raw()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_string() {
        let public_key = CString::new("your_public_key").expect("CString::new failed");
        let username = CString::new("test_user").expect("CString::new failed");

        let result_ptr = get_string(public_key.as_ptr(), username.as_ptr());

        let result_cstr = unsafe { CStr::from_ptr(result_ptr) };
        let result_str = result_cstr.to_string_lossy().to_string();

        // Verify that the result contains the expected strings
        assert!(result_str
            .contains("hi test_user, thanks for visiting me, feel free to check all my notes!\n"));
        assert!(result_str.contains("your_public_key"));

        // The ASCII cat pattern should be present in the result
        assert!(result_str.contains(r#"/\___/\"#));

        // Don't forget to free the memory allocated for the result string in the get_string function
        unsafe {
            CString::from_raw(result_ptr);
        }
    }
}
